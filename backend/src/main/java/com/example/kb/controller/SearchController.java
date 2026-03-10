package com.example.kb.controller;

import com.example.kb.common.ApiResponse;
import com.example.kb.dto.request.SearchRequest;
import com.example.kb.dto.response.SearchItemResponse;
import com.example.kb.service.SearchService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @PostMapping("/query")
    public ApiResponse<Object> query(@Valid @RequestBody SearchRequest request) {
        List<SearchItemResponse> items = searchService.search(request);
        return ApiResponse.success(Map.of(
                "total", items.size(),
                "items", items
        ));
    }
}
