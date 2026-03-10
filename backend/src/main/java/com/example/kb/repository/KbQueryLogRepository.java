package com.example.kb.repository;

import com.example.kb.entity.KbQueryLog;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KbQueryLogRepository extends JpaRepository<KbQueryLog, UUID> {
}
