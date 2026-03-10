package com.example.kb.repository;

import com.example.kb.entity.KbAdminUser;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KbAdminUserRepository extends JpaRepository<KbAdminUser, UUID> {
    Optional<KbAdminUser> findByUsername(String username);
}
