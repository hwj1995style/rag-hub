package com.example.kb.service;

import com.example.kb.dto.request.SearchRequest;
import com.example.kb.dto.response.SearchItemResponse;
import java.util.List;

public interface SearchService {
    List<SearchItemResponse> search(SearchRequest request);
}
