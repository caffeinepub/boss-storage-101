import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type OldFileMetadata = {
    fileId : Text;
    originalFilename : Text;
    mimeType : Text;
    sizeBytes : Nat;
    uploadTimestamp : Time.Time;
    exifCaptureTimestamp : ?Time.Time;
    category : { #photo; #pdf; #audio; #heic; #other; #video };
    blob : Storage.ExternalBlob;
    folderId : ?Text;
  };

  type OldFolder = {
    folderId : Text;
    name : Text;
    createdAt : Time.Time;
  };

  type OldActor = {
    files : Map.Map<Text, OldFileMetadata>;
    folders : List.List<OldFolder>;
  };

  type NewFileMetadata = {
    fileId : Text;
    originalFilename : Text;
    mimeType : Text;
    sizeBytes : Nat;
    uploadTimestamp : Time.Time;
    exifCaptureTimestamp : ?Time.Time;
    category : { #photo; #pdf; #audio; #heic; #other; #video };
    blob : Storage.ExternalBlob;
    folderId : ?Text;
    owner : ?Principal;
  };

  type NewFolder = {
    folderId : Text;
    name : Text;
    createdAt : Time.Time;
    owner : ?Principal;
  };

  type NewActor = {
    files : Map.Map<Text, NewFileMetadata>;
    folders : Map.Map<Text, NewFolder>;
  };

  public func run(old : OldActor) : NewActor {
    let newFiles = old.files.map<Text, OldFileMetadata, NewFileMetadata>(
      func(_id, file) {
        { file with owner = null };
      }
    );

    let newFolders = Map.empty<Text, NewFolder>();
    for (folder in old.folders.values()) {
      newFolders.add(
        folder.folderId,
        {
          folder with owner = null;
        },
      );
    };

    {
      files = newFiles;
      folders = newFolders;
    };
  };
};
