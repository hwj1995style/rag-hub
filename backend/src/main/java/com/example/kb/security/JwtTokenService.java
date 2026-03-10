package com.example.kb.security;

import com.example.kb.entity.KbAdminUser;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final ObjectMapper objectMapper;
    private final SecurityProperties securityProperties;
    private final Base64.Encoder urlEncoder = Base64.getUrlEncoder().withoutPadding();
    private final Base64.Decoder urlDecoder = Base64.getUrlDecoder();

    public JwtTokenService(ObjectMapper objectMapper, SecurityProperties securityProperties) {
        this.objectMapper = objectMapper;
        this.securityProperties = securityProperties;
    }

    public String generateToken(KbAdminUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(getExpirationSeconds());
        Map<String, Object> header = Map.of(
                "alg", "HS256",
                "typ", "JWT"
        );
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", user.getUsername());
        payload.put("uid", user.getId().toString());
        payload.put("role", user.getRoleCode());
        payload.put("display_name", user.getDisplayName());
        payload.put("iss", securityProperties.getJwt().getIssuer());
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", expiresAt.getEpochSecond());
        String headerPart = encodeJson(header);
        String payloadPart = encodeJson(payload);
        String signingInput = headerPart + "." + payloadPart;
        return signingInput + "." + sign(signingInput);
    }

    public Optional<JwtClaims> parse(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return Optional.empty();
            }
            String signingInput = parts[0] + "." + parts[1];
            byte[] expected = urlDecoder.decode(sign(signingInput));
            byte[] actual = urlDecoder.decode(parts[2]);
            if (!MessageDigest.isEqual(expected, actual)) {
                return Optional.empty();
            }
            Map<String, Object> payload = objectMapper.readValue(urlDecoder.decode(parts[1]), MAP_TYPE);
            String issuer = String.valueOf(payload.getOrDefault("iss", ""));
            if (!securityProperties.getJwt().getIssuer().equals(issuer)) {
                return Optional.empty();
            }
            long exp = asLong(payload.get("exp"));
            if (Instant.now().getEpochSecond() >= exp) {
                return Optional.empty();
            }
            return Optional.of(new JwtClaims(
                    String.valueOf(payload.getOrDefault("sub", "")),
                    String.valueOf(payload.getOrDefault("uid", "")),
                    String.valueOf(payload.getOrDefault("role", "")),
                    String.valueOf(payload.getOrDefault("display_name", "")),
                    exp
            ));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    public long getExpirationSeconds() {
        return securityProperties.getJwt().getExpirationMinutes() * 60;
    }

    private String encodeJson(Map<String, Object> value) {
        try {
            return urlEncoder.encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (Exception ex) {
            throw new IllegalStateException("failed to encode jwt payload", ex);
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(securityProperties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return urlEncoder.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("failed to sign jwt token", ex);
        }
    }

    private long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }

    public record JwtClaims(
            String username,
            String userId,
            String roleCode,
            String displayName,
            long expiresAt
    ) {
    }
}
