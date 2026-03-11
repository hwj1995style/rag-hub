package com.example.kb.config;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "kb")
public class KbProperties {

    private final Storage storage = new Storage();
    private final Search search = new Search();
    private final Vector vector = new Vector();
    private final Llm llm = new Llm();

    public Storage getStorage() {
        return storage;
    }

    public Search getSearch() {
        return search;
    }

    public Vector getVector() {
        return vector;
    }

    public Llm getLlm() {
        return llm;
    }

    public static class Storage {
        private String mode = "local";
        private String endpoint;
        private String accessKey;
        private String secretKey;
        private String bucket = "kb-uploads";
        private String uploadRoot = "parser-worker/mock-storage";

        public String getMode() { return mode; }
        public void setMode(String mode) { this.mode = mode; }
        public String getEndpoint() { return endpoint; }
        public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
        public String getAccessKey() { return accessKey; }
        public void setAccessKey(String accessKey) { this.accessKey = accessKey; }
        public String getSecretKey() { return secretKey; }
        public void setSecretKey(String secretKey) { this.secretKey = secretKey; }
        public String getBucket() { return bucket; }
        public void setBucket(String bucket) { this.bucket = bucket; }
        public String getUploadRoot() { return uploadRoot; }
        public void setUploadRoot(String uploadRoot) { this.uploadRoot = uploadRoot; }
    }

    public static class Search {
        private boolean enabled = true;
        private String[] esUris = new String[0];
        private String indexName = "kb_chunk";
        private int timeoutSeconds = 5;
        private int lexicalTopK = 10;

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public String[] getEsUris() { return esUris; }
        public void setEsUris(String[] esUris) { this.esUris = esUris; }
        public String getIndexName() { return indexName; }
        public void setIndexName(String indexName) { this.indexName = indexName; }
        public int getTimeoutSeconds() { return timeoutSeconds; }
        public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
        public int getLexicalTopK() { return lexicalTopK; }
        public void setLexicalTopK(int lexicalTopK) { this.lexicalTopK = lexicalTopK; }
    }

    public static class Vector {
        private boolean enabled = true;
        private int vectorTopK = 10;
        private String embeddingModel = "mock-embedding-v1";
        private int embeddingDim = 1024;
        private String qdrantHost = "127.0.0.1";
        private int qdrantPort = 6333;
        private String qdrantCollection = "kb_chunk";
        private int timeoutSeconds = 5;

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public int getVectorTopK() { return vectorTopK; }
        public void setVectorTopK(int vectorTopK) { this.vectorTopK = vectorTopK; }
        public String getEmbeddingModel() { return embeddingModel; }
        public void setEmbeddingModel(String embeddingModel) { this.embeddingModel = embeddingModel; }
        public int getEmbeddingDim() { return embeddingDim; }
        public void setEmbeddingDim(int embeddingDim) { this.embeddingDim = embeddingDim; }
        public String getQdrantHost() { return qdrantHost; }
        public void setQdrantHost(String qdrantHost) { this.qdrantHost = qdrantHost; }
        public int getQdrantPort() { return qdrantPort; }
        public void setQdrantPort(int qdrantPort) { this.qdrantPort = qdrantPort; }
        public String getQdrantCollection() { return qdrantCollection; }
        public void setQdrantCollection(String qdrantCollection) { this.qdrantCollection = qdrantCollection; }
        public int getTimeoutSeconds() { return timeoutSeconds; }
        public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
    }

    public static class Llm {
        private boolean enabled = false;
        private boolean failOpen = true;
        private String baseUrl = "https://api.openai.com";
        private String chatPath = "/v1/chat/completions";
        private String apiKey = "";
        private String model = "gpt-4o-mini";
        private double temperature = 0.2;
        private int timeoutSeconds = 30;
        private String systemPrompt = "You are a knowledge base assistant. Answer only from retrieved evidence and state clearly when evidence is insufficient.";
        private String authHeaderName = "Authorization";
        private String authHeaderPrefix = "Bearer ";
        private String organizationHeaderName = "";
        private String organizationHeaderValue = "";
        private String workspaceHeaderName = "";
        private String workspaceHeaderValue = "";
        private String contentPath = "choices[0].message.content";
        private String errorCodePath = "error.code";
        private String errorMessagePath = "error.message";
        private Map<String, String> extraHeaders = new LinkedHashMap<>();

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public boolean isFailOpen() { return failOpen; }
        public void setFailOpen(boolean failOpen) { this.failOpen = failOpen; }
        public String getBaseUrl() { return baseUrl; }
        public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
        public String getChatPath() { return chatPath; }
        public void setChatPath(String chatPath) { this.chatPath = chatPath; }
        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }
        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
        public double getTemperature() { return temperature; }
        public void setTemperature(double temperature) { this.temperature = temperature; }
        public int getTimeoutSeconds() { return timeoutSeconds; }
        public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
        public String getSystemPrompt() { return systemPrompt; }
        public void setSystemPrompt(String systemPrompt) { this.systemPrompt = systemPrompt; }
        public String getAuthHeaderName() { return authHeaderName; }
        public void setAuthHeaderName(String authHeaderName) { this.authHeaderName = authHeaderName; }
        public String getAuthHeaderPrefix() { return authHeaderPrefix; }
        public void setAuthHeaderPrefix(String authHeaderPrefix) { this.authHeaderPrefix = authHeaderPrefix; }
        public String getOrganizationHeaderName() { return organizationHeaderName; }
        public void setOrganizationHeaderName(String organizationHeaderName) { this.organizationHeaderName = organizationHeaderName; }
        public String getOrganizationHeaderValue() { return organizationHeaderValue; }
        public void setOrganizationHeaderValue(String organizationHeaderValue) { this.organizationHeaderValue = organizationHeaderValue; }
        public String getWorkspaceHeaderName() { return workspaceHeaderName; }
        public void setWorkspaceHeaderName(String workspaceHeaderName) { this.workspaceHeaderName = workspaceHeaderName; }
        public String getWorkspaceHeaderValue() { return workspaceHeaderValue; }
        public void setWorkspaceHeaderValue(String workspaceHeaderValue) { this.workspaceHeaderValue = workspaceHeaderValue; }
        public String getContentPath() { return contentPath; }
        public void setContentPath(String contentPath) { this.contentPath = contentPath; }
        public String getErrorCodePath() { return errorCodePath; }
        public void setErrorCodePath(String errorCodePath) { this.errorCodePath = errorCodePath; }
        public String getErrorMessagePath() { return errorMessagePath; }
        public void setErrorMessagePath(String errorMessagePath) { this.errorMessagePath = errorMessagePath; }
        public Map<String, String> getExtraHeaders() { return extraHeaders; }
        public void setExtraHeaders(Map<String, String> extraHeaders) { this.extraHeaders = extraHeaders; }
    }
}
