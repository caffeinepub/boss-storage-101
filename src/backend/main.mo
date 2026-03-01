import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Time "mo:core/Time";
import List "mo:core/List";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
actor {
  // Initialize access control
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type FileCategory = { #photo; #pdf; #audio; #heic; #other; #video };

  type FileMetadata = {
    fileId : Text;
    originalFilename : Text;
    mimeType : Text;
    sizeBytes : Nat;
    uploadTimestamp : Time.Time;
    exifCaptureTimestamp : ?Time.Time;
    category : FileCategory;
    blob : Storage.ExternalBlob;
    folderId : ?Text;
    owner : ?Principal;
  };

  module FileMetadata {
    public func compare(a : FileMetadata, b : FileMetadata) : Order.Order {
      Text.compare(a.fileId, b.fileId);
    };
  };

  type Folder = {
    folderId : Text;
    name : Text;
    createdAt : Time.Time;
    owner : ?Principal;
  };

  module Folder {
    public func compare(a : Folder, b : Folder) : Order.Order {
      Text.compare(a.folderId, b.folderId);
    };
  };

  type UserProfile = {
    name : Text;
  };

  let files = Map.empty<Text, FileMetadata>();
  let folders = Map.empty<Text, Folder>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  func hasFileAccess(caller : Principal, file : FileMetadata) : Bool {
    switch (file.owner) {
      case (null) { true };
      case (?owner) { owner == caller };
    };
  };

  func hasFolderAccess(caller : Principal, folder : Folder) : Bool {
    switch (folder.owner) {
      case (null) { true };
      case (?owner) { owner == caller };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func uploadFile(
    fileId : Text,
    originalFilename : Text,
    mimeType : Text,
    sizeBytes : Nat,
    exifCaptureTimestamp : ?Time.Time,
    category : FileCategory,
    blob : Storage.ExternalBlob,
    folderId : ?Text,
  ) : async FileMetadata {
    // Anonymous users (guests) can upload but create legacy files
    // Authenticated users must have at least #user role
    let isAnonymous = caller == Principal.fromText("2vxsx-fae");

    if (not isAnonymous and not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload files");
    };

    let metadata : FileMetadata = {
      fileId;
      originalFilename;
      mimeType;
      sizeBytes;
      uploadTimestamp = Time.now();
      exifCaptureTimestamp;
      category;
      blob;
      folderId;
      owner = if (isAnonymous) {
        null;
      } else {
        ?caller;
      };
    };

    files.add(fileId, metadata);
    metadata;
  };

  public query ({ caller }) func listFiles(folderId : ?Text) : async [FileMetadata] {
    files.values().toArray().filter(
      func(file) {
        hasFileAccess(caller, file) and (
          switch (folderId, file.folderId) {
            case (null, _) { true };
            case (?fid, ?f) { fid == f };
            case (_, _) { false };
          }
        );
      }
    );
  };

  public shared ({ caller }) func deleteFile(fileId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete files");
    };

    switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?file) {
        if (not hasFileAccess(caller, file)) {
          Runtime.trap("Unauthorized: You don't have access to this file");
        };
        files.remove(fileId);
      };
    };
  };

  public shared ({ caller }) func deleteFiles(fileIds : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete files");
    };

    for (fileId in fileIds.values()) {
      switch (files.get(fileId)) {
        case (?file) {
          if (hasFileAccess(caller, file)) {
            files.remove(fileId);
          };
        };
        case (null) {};
      };
    };
  };

  public query ({ caller }) func getFileMetadata(fileId : Text) : async FileMetadata {
    switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?metadata) {
        if (not hasFileAccess(caller, metadata)) {
          Runtime.trap("Unauthorized: You don't have access to this file");
        };
        metadata;
      };
    };
  };

  public shared ({ caller }) func moveFileToFolder(fileId : Text, folderId : ?Text) : async FileMetadata {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can move files");
    };

    switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?file) {
        if (not hasFileAccess(caller, file)) {
          Runtime.trap("Unauthorized: You don't have access to this file");
        };
        let updatedMetadata = { file with folderId };
        files.add(fileId, updatedMetadata);
        updatedMetadata;
      };
    };
  };

  public shared ({ caller }) func createFolder(folderId : Text, name : Text) : async Folder {
    let isAnonymous = caller == Principal.fromText("2vxsx-fae");

    if (not isAnonymous and not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create folders");
    };

    let folder : Folder = {
      folderId;
      name;
      createdAt = Time.now();
      owner = if (isAnonymous) {
        null;
      } else {
        ?caller;
      };
    };

    folders.add(folderId, folder);
    folder;
  };

  public query ({ caller }) func listFolders() : async [Folder] {
    folders.values().toArray().filter(
      func(folder) { hasFolderAccess(caller, folder) }
    );
  };

  public shared ({ caller }) func deleteFolder(folderId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete folders");
    };

    switch (folders.get(folderId)) {
      case (null) { Runtime.trap("Folder not found") };
      case (?folder) {
        if (not hasFolderAccess(caller, folder)) {
          Runtime.trap("Unauthorized: You don't have access to this folder");
        };
        folders.remove(folderId);

        for ((id, file) in files.entries()) {
          if (file.folderId == ?folderId and hasFileAccess(caller, file)) {
            files.add(id, { file with folderId = null });
          };
        };
      };
    };
  };

  public shared ({ caller }) func renameFolder(folderId : Text, newName : Text) : async Folder {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can rename folders");
    };

    switch (folders.get(folderId)) {
      case (null) { Runtime.trap("Folder not found") };
      case (?folder) {
        if (not hasFolderAccess(caller, folder)) {
          Runtime.trap("Unauthorized: You don't have access to this folder");
        };
        let updatedFolder = { folder with name = newName };
        folders.add(folderId, updatedFolder);
        updatedFolder;
      };
    };
  };

  public shared ({ caller }) func claimLegacyData() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Cannot claim as anonymous user. Please enable your passkey");
    };

    var claimedCount = 0;

    for ((id, file) in files.entries()) {
      switch (file.owner) {
        case (null) {
          files.add(id, { file with owner = ?caller });
          claimedCount += 1;
        };
        case (_) {};
      };
    };

    for ((id, folder) in folders.entries()) {
      switch (folder.owner) {
        case (null) { folders.add(id, { folder with owner = ?caller }) };
        case (_) {};
      };
    };

    claimedCount;
  };
};
