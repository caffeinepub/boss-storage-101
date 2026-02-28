import List "mo:core/List";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

module {
  type OldFileCategory = { #photo; #pdf; #audio; #heic; #other };
  type OldFileMetadata = {
    fileId : Text;
    originalFilename : Text;
    mimeType : Text;
    sizeBytes : Nat;
    uploadTimestamp : Time.Time;
    exifCaptureTimestamp : ?Time.Time;
    category : OldFileCategory;
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

  type NewFileCategory = { #photo; #pdf; #audio; #heic; #other; #video };
  type NewFileMetadata = {
    fileId : Text;
    originalFilename : Text;
    mimeType : Text;
    sizeBytes : Nat;
    uploadTimestamp : Time.Time;
    exifCaptureTimestamp : ?Time.Time;
    category : NewFileCategory;
    blob : Storage.ExternalBlob;
    folderId : ?Text;
  };
  type NewFolder = {
    folderId : Text;
    name : Text;
    createdAt : Time.Time;
  };
  type NewActor = {
    files : Map.Map<Text, NewFileMetadata>;
    folders : List.List<NewFolder>;
  };

  public func run(old : OldActor) : NewActor {
    let updatedFiles = old.files.map<Text, OldFileMetadata, NewFileMetadata>(
      func(_id, oldFile) {
        switch (oldFile.category) {
          case (#photo) {
            { oldFile with category = #photo : NewFileCategory };
          };
          case (#pdf) {
            { oldFile with category = #pdf : NewFileCategory };
          };
          case (#audio) {
            { oldFile with category = #audio : NewFileCategory };
          };
          case (#heic) {
            { oldFile with category = #heic : NewFileCategory };
          };
          case (#other) {
            { oldFile with category = #other : NewFileCategory };
          };
        };
      }
    );
    {
      files = updatedFiles;
      folders = old.folders;
    };
  };
};
