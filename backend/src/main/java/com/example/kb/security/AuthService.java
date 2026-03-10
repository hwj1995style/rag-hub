package com.example.kb.security;

import com.example.kb.dto.request.LoginRequest;
import com.example.kb.dto.response.LoginResponse;
import com.example.kb.entity.KbAdminUser;
import com.example.kb.repository.KbAdminUserRepository;
import java.time.OffsetDateTime;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final KbAdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    public AuthService(KbAdminUserRepository adminUserRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenService jwtTokenService) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        KbAdminUser user = adminUserRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("username or password is invalid"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("username or password is invalid");
        }
        if (!"active".equalsIgnoreCase(user.getStatus())) {
            throw new DisabledException("user is disabled");
        }
        user.setLastLoginAt(OffsetDateTime.now());
        adminUserRepository.save(user);
        String token = jwtTokenService.generateToken(user);
        return new LoginResponse(
                "Bearer",
                token,
                jwtTokenService.getExpirationSeconds(),
                new LoginResponse.UserInfo(
                        user.getId().toString(),
                        user.getUsername(),
                        user.getDisplayName(),
                        user.getRoleCode()
                )
        );
    }
}
