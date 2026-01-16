// Type augmentation to resolve FormData conflicts between Web API and node-appwrite
declare global {
    // Ensure we're using the Web API FormData in Next.js API routes
    interface FormData extends globalThis.FormData { }
}

export { };
