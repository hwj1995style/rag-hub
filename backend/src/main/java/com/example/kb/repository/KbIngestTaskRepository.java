package com.example.kb.repository;

import com.example.kb.entity.KbIngestTask;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface KbIngestTaskRepository extends JpaRepository<KbIngestTask, UUID>, JpaSpecificationExecutor<KbIngestTask> {
}