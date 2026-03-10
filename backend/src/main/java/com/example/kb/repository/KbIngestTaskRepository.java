package com.example.kb.repository;

import com.example.kb.entity.KbIngestTask;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KbIngestTaskRepository extends JpaRepository<KbIngestTask, UUID> {
}
