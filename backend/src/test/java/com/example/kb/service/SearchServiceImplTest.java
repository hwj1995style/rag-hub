package com.example.kb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.when;

import com.example.kb.dto.request.SearchRequest;
import com.example.kb.dto.response.SearchItemResponse;
import com.example.kb.entity.KbChunk;
import com.example.kb.entity.KbDocument;
import com.example.kb.repository.KbChunkRepository;
import com.example.kb.repository.KbDocumentRepository;
import com.example.kb.search.LexicalSearchClient;
import com.example.kb.search.VectorSearchClient;
import com.example.kb.service.impl.SearchServiceImpl;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SearchServiceImplTest {

    @Mock
    private KbChunkRepository chunkRepository;
    @Mock
    private KbDocumentRepository documentRepository;
    @Mock
    private LexicalSearchClient lexicalSearchClient;
    @Mock
    private VectorSearchClient vectorSearchClient;
    @Mock
    private DocumentAccessService documentAccessService;

    @InjectMocks
    private SearchServiceImpl searchService;

    @BeforeEach
    void setUp() {
        when(documentAccessService.filterAccessibleDocumentIds(anySet()))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void shouldFallbackWhenEsDisabled() {
        KbChunk chunk = fallbackChunk();
        when(lexicalSearchClient.search("business license", 10)).thenReturn(List.of());
        when(vectorSearchClient.search("business license", 10)).thenReturn(List.of());
        when(chunkRepository.findAll()).thenReturn(List.of(chunk));
        when(documentRepository.findById(UUID.fromString("11111111-1111-1111-1111-111111111111"))).thenReturn(Optional.of(document()));

        List<SearchItemResponse> result = searchService.search(new SearchRequest("business license", 10, null));

        assertEquals(1, result.size());
        assertEquals("Customer Credit Policy", result.get(0).documentTitle());
    }

    @Test
    void shouldFallbackWhenEsEnabledButFails() {
        KbChunk chunk = fallbackChunk();
        when(lexicalSearchClient.search("business license", 10)).thenThrow(new IllegalStateException("es down"));
        when(vectorSearchClient.search("business license", 10)).thenReturn(List.of());
        when(chunkRepository.findAll()).thenReturn(List.of(chunk));
        when(documentRepository.findById(UUID.fromString("11111111-1111-1111-1111-111111111111"))).thenReturn(Optional.of(document()));

        List<SearchItemResponse> result = searchService.search(new SearchRequest("business license", 10, null));

        assertEquals(1, result.size());
        assertEquals("p12", result.get(0).locator());
    }

    @Test
    void shouldReturnLexicalResultsWhenVectorDisabled() {
        SearchItemResponse lexical = new SearchItemResponse("chunk-1", "11111111-1111-1111-1111-111111111111", "Customer Credit Policy", "3.2 Required Materials", "p12", 1.2, "business license");
        when(lexicalSearchClient.search("business license", 10)).thenReturn(List.of(lexical));
        when(vectorSearchClient.search("business license", 10)).thenReturn(List.of());

        List<SearchItemResponse> result = searchService.search(new SearchRequest("business license", 10, null));

        assertEquals(1, result.size());
        assertEquals("chunk-1", result.get(0).chunkId());
    }

    @Test
    void shouldKeepLexicalResultsWhenVectorFails() {
        SearchItemResponse lexical = new SearchItemResponse("chunk-1", "11111111-1111-1111-1111-111111111111", "Customer Credit Policy", "3.2 Required Materials", "p12", 1.2, "business license");
        when(lexicalSearchClient.search("business license", 10)).thenReturn(List.of(lexical));
        when(vectorSearchClient.search("business license", 10)).thenThrow(new IllegalStateException("vector down"));

        List<SearchItemResponse> result = searchService.search(new SearchRequest("business license", 10, null));

        assertEquals(1, result.size());
        assertEquals("chunk-1", result.get(0).chunkId());
    }

    private KbChunk fallbackChunk() {
        KbChunk chunk = new KbChunk();
        chunk.setId(UUID.fromString("22222222-2222-2222-2222-222222222222"));
        chunk.setDocumentId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        chunk.setChunkNo(1);
        chunk.setChunkType("paragraph");
        chunk.setTitlePath("3.2 Required Materials");
        chunk.setLocator("p12");
        chunk.setContentText("Credit approval requires a business license, two years of financial statements, and a credit application form.");
        chunk.setContentSummary("Required materials for credit approval");
        return chunk;
    }

    private KbDocument document() {
        KbDocument document = new KbDocument();
        document.setId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        document.setTitle("Customer Credit Policy");
        return document;
    }
}