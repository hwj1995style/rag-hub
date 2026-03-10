package com.example.kb.qa;

import com.example.kb.dto.response.CitationResponse;
import com.example.kb.dto.response.SearchItemResponse;
import java.util.List;

public record QaContext(String userQuestion, String assembledContext, List<CitationResponse> citations, int usedChunkCount) {
    public static QaContext fromSearchResults(String userQuestion, List<SearchItemResponse> hits, int maxChunks) {
        List<SearchItemResponse> selected = hits.stream().limit(maxChunks).toList();
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < selected.size(); i++) {
            SearchItemResponse item = selected.get(i);
            builder.append("[片段").append(i + 1).append("] 文档:")
                    .append(item.documentTitle())
                    .append(" | 位置:")
                    .append(item.titlePath())
                    .append(" | 内容:")
                    .append(item.snippet())
                    .append("\n");
        }
        List<CitationResponse> citations = selected.stream()
                .map(item -> new CitationResponse(item.documentId(), item.documentTitle(), item.titlePath(), item.locator(), item.snippet()))
                .toList();
        return new QaContext(userQuestion, builder.toString().trim(), citations, selected.size());
    }
}
