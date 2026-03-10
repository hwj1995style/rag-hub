package com.example.kb.health;

import java.util.Map;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class KbHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        return Health.up()
                .withDetail("application", "rag-hub-backend")
                .withDetail("components", Map.of(
                        "api", "up",
                        "database", "managed by spring datasource",
                        "search", "stub mode"
                ))
                .build();
    }
}
