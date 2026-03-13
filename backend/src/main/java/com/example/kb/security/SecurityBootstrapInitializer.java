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
        bootstrapAccount(
                securityProperties.getBootstrapAdmin().isEnabled(),
                securityProperties.getBootstrapAdmin().getUsername(),
                securityProperties.getBootstrapAdmin().getPassword(),
                securityProperties.getBootstrapAdmin().getDisplayName(),
                securityProperties.getBootstrapAdmin().getRoleCode(),
                "bootstrap account"
        );
        bootstrapAccount(
                securityProperties.getBootstrapViewer().isEnabled(),
                securityProperties.getBootstrapViewer().getUsername(),
                securityProperties.getBootstrapViewer().getPassword(),
                securityProperties.getBootstrapViewer().getDisplayName(),
                securityProperties.getBootstrapViewer().getRoleCode(),
                "bootstrap viewer account"
        );
    }

    private void bootstrapAccount(boolean enabled,
                                  String username,
                                  String password,
                                  String displayName,
                                  String roleCode,
                                  String label) {
        if (!enabled) {
            return;
        }
        if (adminUserRepository.findByUsername(username).isPresent()) {
            return;
        }
        KbAdminUser user = new KbAdminUser();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setDisplayName(displayName);
        user.setRoleCode(roleCode);
        user.setStatus("active");
        adminUserRepository.save(user);
        log.warn("Bootstrapped {} '{}'. Change the password before exposing this environment.", label, username);
    }
}
