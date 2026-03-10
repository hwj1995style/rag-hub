package com.example.kb.dto.response;

import java.util.List;

public record PageResponse<T>(long total, int pageNo, int pageSize, List<T> items) {
}
