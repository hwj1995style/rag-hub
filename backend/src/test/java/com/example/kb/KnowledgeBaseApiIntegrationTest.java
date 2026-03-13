package com.example.kb;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.kb.repository.KbPermissionPolicyRepository;
import com.example.kb.repository.KbQueryLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Sql(scripts = {"classpath:sql/cleanup.sql", "classpath:sql/seed-test-data.sql"}, executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class KnowledgeBaseApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private KbQueryLogRepository queryLogRepository;

    @Autowired
    private KbPermissionPolicyRepository permissionPolicyRepository;

    @Test
    void shouldLoginAndReturnJwtToken() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "tester",
                                  "password": "test123456"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is("KB-00000")))
                .andExpect(jsonPath("$.data.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.user.username", is("tester")))
                .andExpect(jsonPath("$.data.user.roleCode", is("admin")));
    }

    @Test
    void shouldRejectBadCredentials() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "tester",
                                  "password": "wrong-password"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("KB-40102")));
    }

    @Test
    void shouldRequireAuthenticationForProtectedApis() throws Exception {
        mockMvc.perform(get("/api/documents"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("KB-40101")));
    }

    @Test
    void shouldListSeedDocuments() throws Exception {
        mockMvc.perform(get("/api/documents")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is("KB-00000")))
                .andExpect(jsonPath("$.data.total", is(1)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].documentId", is("11111111-1111-1111-1111-111111111111")))
                .andExpect(jsonPath("$.data.items[0].title", is("Customer Credit Policy")));
    }

    @Test
    void shouldReturnDocumentDetail() throws Exception {
        mockMvc.perform(get("/api/documents/11111111-1111-1111-1111-111111111111")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.document_id", is("11111111-1111-1111-1111-111111111111")))
                .andExpect(jsonPath("$.data.current_version.version_id", is("22222222-2222-2222-2222-222222222222")))
                .andExpect(jsonPath("$.data.current_version.version_no", is("v1.0")));
    }

    @Test
    void shouldRejectDocumentDetailWhenViewerHasNoMatchingPolicy() throws Exception {
        mockMvc.perform(get("/api/documents/11111111-1111-1111-1111-111111111111")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("viewer", "viewer123")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("KB-40301")));
    }
    @Test
    void shouldReturnDocumentChunks() throws Exception {
        mockMvc.perform(get("/api/documents/11111111-1111-1111-1111-111111111111/chunks")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total", is(3)))
                .andExpect(jsonPath("$.data.items", hasSize(3)));
    }

    @Test
    void shouldRejectDocumentChunksWhenViewerHasNoMatchingPolicy() throws Exception {
        mockMvc.perform(get("/api/documents/11111111-1111-1111-1111-111111111111/chunks")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("viewer", "viewer123")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("KB-40301")));
    }

    @Test
    void shouldAllowDocumentReadWhenViewerRolePolicyMatches() throws Exception {
        mockMvc.perform(post("/api/permissions/bind")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resourceType": "document",
                                  "resourceId": "11111111-1111-1111-1111-111111111111",
                                  "policies": [
                                    {"subjectType": "role", "subjectValue": "viewer", "effect": "allow"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/documents/11111111-1111-1111-1111-111111111111")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("viewer", "viewer123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.document_id", is("11111111-1111-1111-1111-111111111111")));

        mockMvc.perform(get("/api/documents/11111111-1111-1111-1111-111111111111/chunks")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("viewer", "viewer123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total", is(3)));
    }

    @Test
    void shouldPreferDenyOverAllowForDocumentRead() throws Exception {
        mockMvc.perform(post("/api/permissions/bind")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resourceType": "document",
                                  "resourceId": "11111111-1111-1111-1111-111111111111",
                                  "policies": [
                                    {"subjectType": "role", "subjectValue": "viewer", "effect": "allow"},
                                    {"subjectType": "user", "subjectValue": "viewer", "effect": "deny"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/documents/11111111-1111-1111-1111-111111111111")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("viewer", "viewer123")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("KB-40301")));
    }
    @Test
    void shouldReturnTaskById() throws Exception {
        mockMvc.perform(get("/api/tasks/44444444-4444-4444-4444-444444444444")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.taskId", is("44444444-4444-4444-4444-444444444444")))
                .andExpect(jsonPath("$.data.status", is("success")))
                .andExpect(jsonPath("$.data.documentId", is("11111111-1111-1111-1111-111111111111")))
                .andExpect(jsonPath("$.data.versionId", is("22222222-2222-2222-2222-222222222222")));
    }

    @Test
    void shouldListTasks() throws Exception {
        mockMvc.perform(get("/api/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total", is(1)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].taskId", is("44444444-4444-4444-4444-444444444444")));
    }

    @Test
    void shouldCreateBatchImportTask() throws Exception {
        mockMvc.perform(post("/api/documents/batch-import")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sourceType": "s3",
                                  "sourceUri": "s3://bucket/policies",
                                  "bizDomain": "risk",
                                  "department": "RiskMgmt",
                                  "securityLevel": "internal"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accepted_count", is(1)))
                .andExpect(jsonPath("$.data.task_count", is(1)))
                .andExpect(jsonPath("$.data.task_ids", hasSize(1)));
    }

    @Test
    void shouldFilterTasksBySourceKeyword() throws Exception {
        mockMvc.perform(post("/api/documents/batch-import")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sourceType": "s3",
                                  "sourceUri": "s3://playwright/policies",
                                  "bizDomain": "risk",
                                  "department": "RiskMgmt",
                                  "securityLevel": "internal"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/tasks")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .param("taskType", "batch_import")
                        .param("sourceKeyword", "playwright/policies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total", is(1)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].taskType", is("batch_import")))
                .andExpect(jsonPath("$.data.items[0].sourceUri", is("s3://playwright/policies")));
    }

    @Test
    void shouldReturnQueryLogById() throws Exception {
        mockMvc.perform(get("/api/query-logs/66666666-6666-6666-6666-666666666666")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.log_id", is("66666666-6666-6666-6666-666666666666")))
                .andExpect(jsonPath("$.data.query_text", is("What materials are required for credit approval")))
                .andExpect(jsonPath("$.data.rewritten_query", is("credit approval required materials checklist")))
                .andExpect(jsonPath("$.data.retrieved_chunk_ids", hasSize(1)))
                .andExpect(jsonPath("$.data.citations", hasSize(1)));
    }

    @Test
    void shouldListQueryLogs() throws Exception {
        mockMvc.perform(get("/api/query-logs")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total", is(1)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].log_id", is("66666666-6666-6666-6666-666666666666")))
                .andExpect(jsonPath("$.data.items[0].session_id", is("seed-session-001")))
                .andExpect(jsonPath("$.data.items[0].citation_count", is(1)));
    }
    @Test
    void shouldFilterQaResultsWhenViewerHasNoMatchingPolicy() throws Exception {
        mockMvc.perform(post("/api/qa/query")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("viewer", "viewer123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "query": "business license",
                                  "topK": 5,
                                  "returnCitations": true,
                                  "sessionId": "viewer-session-001"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.retrievedCount", is(0)))
                .andExpect(jsonPath("$.data.usedChunkCount", is(0)))
                .andExpect(jsonPath("$.data.citations", hasSize(0)))
                .andExpect(jsonPath("$.data.sessionId", is("viewer-session-001")));
    }

    @Test
    void shouldAllowQaResultsWhenViewerRolePolicyMatches() throws Exception {
        mockMvc.perform(post("/api/permissions/bind")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resourceType": "document",
                                  "resourceId": "11111111-1111-1111-1111-111111111111",
                                  "policies": [
                                    {"subjectType": "role", "subjectValue": "viewer", "effect": "allow"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/qa/query")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("viewer", "viewer123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "query": "business license",
                                  "topK": 5,
                                  "returnCitations": true,
                                  "sessionId": "viewer-session-002"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.retrievedCount", is(1)))
                .andExpect(jsonPath("$.data.citations", hasSize(1)))
                .andExpect(jsonPath("$.data.citations[0].documentId", is("11111111-1111-1111-1111-111111111111")));
    }
    @Test
    void shouldPersistQueryLogWhenQaCalled() throws Exception {
        long before = queryLogRepository.count();

        mockMvc.perform(post("/api/qa/query")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "query": "business license",
                                  "topK": 5,
                                  "returnCitations": true,
                                  "sessionId": "itest-session-001"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.retrievedCount", is(1)))
                .andExpect(jsonPath("$.data.citations", hasSize(1)));

        Assertions.assertEquals(before + 1, queryLogRepository.count());
    }

    @Test
    void shouldBindPermissionsPersistently() throws Exception {
        mockMvc.perform(post("/api/permissions/bind")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resourceType": "document",
                                  "resourceId": "11111111-1111-1111-1111-111111111111",
                                  "policies": [
                                    {"subjectType": "role", "subjectValue": "admin", "effect": "allow"},
                                    {"subjectType": "department", "subjectValue": "RiskMgmt", "effect": "allow"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.policy_count", is(2)));

        Assertions.assertEquals(2,
                permissionPolicyRepository.findByResourceTypeAndResourceId("document",
                        UUID.fromString("11111111-1111-1111-1111-111111111111")).size());
    }

    @Test
    void shouldListBoundPermissionPolicies() throws Exception {
        mockMvc.perform(post("/api/permissions/bind")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resourceType": "document",
                                  "resourceId": "11111111-1111-1111-1111-111111111111",
                                  "policies": [
                                    {"subjectType": "role", "subjectValue": "admin", "effect": "allow"},
                                    {"subjectType": "user", "subjectValue": "viewer", "effect": "deny"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/permissions")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .param("resourceType", "document")
                        .param("resourceId", "11111111-1111-1111-1111-111111111111"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.resourceType", is("document")))
                .andExpect(jsonPath("$.data.resourceId", is("11111111-1111-1111-1111-111111111111")))
                .andExpect(jsonPath("$.data.items", hasSize(2)))
                .andExpect(jsonPath("$.data.items[0].policyId").isString());
    }

    @Test
    void shouldDeleteSinglePermissionPolicy() throws Exception {
        mockMvc.perform(post("/api/permissions/bind")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resourceType": "document",
                                  "resourceId": "11111111-1111-1111-1111-111111111111",
                                  "policies": [
                                    {"subjectType": "role", "subjectValue": "admin", "effect": "allow"},
                                    {"subjectType": "user", "subjectValue": "viewer", "effect": "deny"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(get("/api/permissions")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .param("resourceType", "document")
                        .param("resourceId", "11111111-1111-1111-1111-111111111111"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode items = objectMapper.readTree(result.getResponse().getContentAsString()).path("data").path("items");
        String policyId = items.get(0).path("policyId").asText();

        mockMvc.perform(delete("/api/permissions/" + policyId)
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.policyId", is(policyId)));

        mockMvc.perform(get("/api/permissions")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .param("resourceType", "document")
                        .param("resourceId", "11111111-1111-1111-1111-111111111111"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(1)));
    }

    @Test
    void shouldRejectPermissionBindingForNonAdmin() throws Exception {
        mockMvc.perform(post("/api/permissions/bind")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("viewer", "viewer123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resourceType": "document",
                                  "resourceId": "11111111-1111-1111-1111-111111111111",
                                  "policies": []
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("KB-40301")));
    }

    @Test
    void shouldRejectPermissionDeleteForNonAdmin() throws Exception {
        mockMvc.perform(post("/api/permissions/bind")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resourceType": "document",
                                  "resourceId": "11111111-1111-1111-1111-111111111111",
                                  "policies": [
                                    {"subjectType": "role", "subjectValue": "admin", "effect": "allow"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(get("/api/permissions")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .param("resourceType", "document")
                        .param("resourceId", "11111111-1111-1111-1111-111111111111"))
                .andExpect(status().isOk())
                .andReturn();

        String policyId = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("items").get(0).path("policyId").asText();

        mockMvc.perform(delete("/api/permissions/" + policyId)
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("viewer", "viewer123")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("KB-40301")));
    }

    @Test
    void shouldActivateVersionPersistently() throws Exception {
        mockMvc.perform(post("/api/documents/11111111-1111-1111-1111-111111111111/versions/22222222-2222-2222-2222-222222222223/activate")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "effectiveFrom": "2026-03-10T00:00:00+08:00",
                                  "remark": "switch to history version"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.version_id", is("22222222-2222-2222-2222-222222222223")));

        mockMvc.perform(get("/api/documents/11111111-1111-1111-1111-111111111111")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.current_version.version_id", is("22222222-2222-2222-2222-222222222223")))
                .andExpect(jsonPath("$.data.current_version.version_no", is("v0.9")));
    }

    @Test
    void shouldFilterSearchResultsWhenViewerHasNoMatchingPolicy() throws Exception {
        mockMvc.perform(post("/api/search/query")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("viewer", "viewer123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "query": "business license",
                                  "topK": 10
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total", is(0)))
                .andExpect(jsonPath("$.data.items", hasSize(0)));
    }

    @Test
    void shouldAllowSearchResultsWhenViewerRolePolicyMatches() throws Exception {
        mockMvc.perform(post("/api/permissions/bind")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resourceType": "document",
                                  "resourceId": "11111111-1111-1111-1111-111111111111",
                                  "policies": [
                                    {"subjectType": "role", "subjectValue": "viewer", "effect": "allow"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/search/query")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("viewer", "viewer123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "query": "business license",
                                  "topK": 10
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total", is(1)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].locator", is("p12")));
    }
    @Test
    void shouldSearchSeedChunks() throws Exception {
        mockMvc.perform(post("/api/search/query")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("tester", "test123456"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "query": "business license",
                                  "topK": 10
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total", is(1)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].locator", is("p12")));
    }

    private String bearerToken(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "%s"
                                }
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return "Bearer " + json.path("data").path("accessToken").asText();
    }
}