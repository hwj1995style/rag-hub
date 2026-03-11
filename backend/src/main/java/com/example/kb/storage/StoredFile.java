package com.example.kb.storage;

public record StoredFile(String storagePath, String sourceUri, String fileName, long fileSize) {
}
