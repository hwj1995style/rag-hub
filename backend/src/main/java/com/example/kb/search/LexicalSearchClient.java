package com.example.kb.search;

import com.example.kb.dto.response.SearchItemResponse;
import java.util.List;

public interface LexicalSearchClient {
    List<SearchItemResponse> search(String query, int limit);
}
