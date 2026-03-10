package com.example.kb.security;

import com.example.kb.entity.KbAdminUser;
import com.example.kb.repository.KbAdminUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class SecurityBootstrapInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SecurityBootstrapInitializer.class);

    private final SecurityProperties securityProperties;
    private final KbAdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    public SecurityBootstrapInitializer(SecurityProperties securityProperties,
                                        KbAdminUserRepository adminUserRepository,
                                        PasswordEncoder passwordEncoder) {
        this.securityProperties = securityProperties;
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        SecurityProperties.BootstrapAdmin bootstrapAdmin = securityProperties.getBootstrapAdmin();
        if (!bootstrapAdmin.isEnabled()) {
            return;
        }
        if (adminUserRepository.findByUsername(bootstrapAdmin.getUsername()).isPresent()) {
            return;
        }
        KbAdminUser user = new KbAdminUser();
        user.setUsername(bootstrapAdmin.getUsername());
        user.setPasswordHash(passwordEncoder.encode(bootstrapAdmin.getPassword()));
        user.setDisplayName(bootstrapAdmin.getDisplayName());
        user.setRoleCode(bootstrapAdmin.getRoleCode());
        user.setStatus("active");
        adminUserRepository.save(user);
        log.warn("Bootstrapped local admin account '{}'. Change the password before exposing this environment.", bootstrapAdmin.getUsername());
    }
}
