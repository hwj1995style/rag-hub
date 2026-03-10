package com.example.kb.qa;

import com.example.kb.dto.response.SearchItemResponse;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class DefaultContextAssembler implements ContextAssembler {

    private static final int DEFAULT_MAX_CHUNKS = 3;

    @Override
    public QaContext assemble(String userQuestion, List<SearchItemResponse> hits) {
        return QaContext.fromSearchResults(userQuestion, hits, DEFAULT_MAX_CHUNKS);
    }
}
