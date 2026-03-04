import Text "mo:core/Text";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Migration "migration";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

(with migration = Migration.run)
actor {
  include MixinStorage();

  type PdfEntry = {
    id : Text;
    title : Text;
    description : Text;
    uploadedAt : Int;
    blobId : Text;
  };

  let adminToken = "dxnamaaz90";

  let pdfEntries = Map.empty<Text, PdfEntry>();

  func validateToken(token : Text) {
    if (token != adminToken) {
      Runtime.trap("Invalid admin token");
    };
  };

  public shared (msg) func addPdf(token : Text, title : Text, description : Text, blobId : Text) : async Text {
    validateToken(token);

    let id = title # "-" # Time.now().toText();
    let entry : PdfEntry = {
      id;
      title;
      description;
      uploadedAt = Time.now();
      blobId;
    };

    pdfEntries.add(id, entry);
    id;
  };

  public shared (msg) func deletePdf(token : Text, id : Text) : async () {
    validateToken(token);
    switch (pdfEntries.get(id)) {
      case (null) { Runtime.trap("PDF not found") };
      case (_) {
        pdfEntries.remove(id);
      };
    };
  };

  public query (msg) func listPdfs() : async [PdfEntry] {
    pdfEntries.values().toArray();
  };

  public query (msg) func getPdf(id : Text) : async PdfEntry {
    switch (pdfEntries.get(id)) {
      case (null) { Runtime.trap("PDF not found") };
      case (?entry) { entry };
    };
  };
};
