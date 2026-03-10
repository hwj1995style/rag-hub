package com.example.kb.dto.response;

public record LoginResponse(
        String tokenType,
        String accessToken,
        long expiresInSeconds,
        UserInfo user
) {
    public record UserInfo(
            String userId,
            String username,
            String displayName,
            String roleCode
    ) {
    }
}
