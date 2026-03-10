package com.example.kb.qa;

import com.example.kb.dto.response.SearchItemResponse;
import java.util.List;

public interface ContextAssembler {
    QaContext assemble(String userQuestion, List<SearchItemResponse> hits);
}
