package com.example.kb.dto.response;

public record ChunkItemResponse(
        String chunkId,
        Integer chunkNo,
        String chunkType,
        String titlePath,
        String locator,
        Integer pageNo,
        String contentText,
        String contentSummary
) {
}
