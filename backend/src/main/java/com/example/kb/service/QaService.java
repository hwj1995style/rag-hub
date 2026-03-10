package com.example.kb.service;

import com.example.kb.dto.request.QaRequest;
import com.example.kb.dto.response.QaResponse;

public interface QaService {
    QaResponse answer(QaRequest request);
}
