import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";


import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

// Use new migration approach with an additional migration module

actor {
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
  };

  module Folder {
    public func compare(a : Folder, b : Folder) : Order.Order {
      Text.compare(a.folderId, b.folderId);
    };
  };

  let files = Map.empty<Text, FileMetadata>();
  var folders : List.List<Folder> = List.empty<Folder>();

  // Upload File
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
    };

    files.add(fileId, metadata);
    metadata;
  };

  // List Files by folderId
  public query ({ caller }) func listFiles(folderId : ?Text) : async [FileMetadata] {
    let fileList = files.values().toArray();

    switch (folderId) {
      case (null) { fileList };
      case (?id) {
        fileList.filter(func(file) { file.folderId == folderId });
      };
    };
  };

  // Delete File
  public shared ({ caller }) func deleteFile(fileId : Text) : async () {
    if (not files.containsKey(fileId)) {
      Runtime.trap("File not found");
    };

    files.remove(fileId);
  };

  // Delete Multiple Files
  public shared ({ caller }) func deleteFiles(fileIds : [Text]) : async () {
    for (fileId in fileIds.values()) {
      files.remove(fileId);
    };
  };

  // Get File Metadata
  public query ({ caller }) func getFileMetadata(fileId : Text) : async FileMetadata {
    switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?metadata) { metadata };
    };
  };

  // Move File to Folder
  public shared ({ caller }) func moveFileToFolder(fileId : Text, folderId : ?Text) : async FileMetadata {
    switch (files.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?fileMetadata) {
        let updatedMetadata = {
          fileMetadata with folderId
        };
        files.add(fileId, updatedMetadata);
        updatedMetadata;
      };
    };
  };

  // Create Folder
  public shared ({ caller }) func createFolder(folderId : Text, name : Text) : async Folder {
    let folder : Folder = {
      folderId;
      name;
      createdAt = Time.now();
    };

    folders.add(folder);
    folder;
  };

  // List All Folders
  public query ({ caller }) func listFolders() : async [Folder] {
    folders.toArray();
  };

  // Delete Folder
  public shared ({ caller }) func deleteFolder(folderId : Text) : async () {
    let newFolders = folders.filter(
      func(folder) {
        folder.folderId != folderId;
      }
    );
    folders := newFolders;

    let updatedFiles = files.map<Text, FileMetadata, FileMetadata>(
      func(_fileId, file) {
        if (file.folderId == ?folderId) {
          { file with folderId = null };
        } else {
          file;
        };
      }
    );
  };

  // Rename Folder
  public shared ({ caller }) func renameFolder(folderId : Text, newName : Text) : async Folder {
    let maybeFolder = folders.find(func(folder) { folder.folderId == folderId });

    switch (maybeFolder) {
      case (null) { Runtime.trap("Folder not found") };
      case (?existingFolder) {
        let updatedFolder = {
          existingFolder with name = newName
        };

        folders := folders.map<Folder, Folder>(
          func(folder) {
            if (folder.folderId == folderId) {
              updatedFolder;
            } else {
              folder;
            };
          }
        );
        updatedFolder;
      };
    };
  };
};
