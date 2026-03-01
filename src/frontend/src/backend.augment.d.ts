export {};

declare module "./backend" {
  interface backendInterface {
    _initializeAccessControlWithSecret(adminToken: string): Promise<void>;
  }

  // Augment createActor return type to include the new method,
  // so config.ts can return it as backendInterface.
  function createActor(
    canisterId: string,
    _uploadFile: (
      file: import("./backend").ExternalBlob,
    ) => Promise<Uint8Array>,
    _downloadFile: (
      file: Uint8Array,
    ) => Promise<import("./backend").ExternalBlob>,
    options?: import("./backend").CreateActorOptions,
  ): import("./backend").Backend & {
    _initializeAccessControlWithSecret(adminToken: string): Promise<void>;
  };
}
