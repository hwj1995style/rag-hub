package com.example.kb.security;

import com.example.kb.repository.KbAdminUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenService jwtTokenService;
    private final KbAdminUserRepository adminUserRepository;

    public JwtAuthenticationFilter(JwtTokenService jwtTokenService, KbAdminUserRepository adminUserRepository) {
        this.jwtTokenService = jwtTokenService;
        this.adminUserRepository = adminUserRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorization.substring(7);
        jwtTokenService.parse(token)
                .flatMap(claims -> adminUserRepository.findByUsername(claims.username()))
                .filter(user -> "active".equalsIgnoreCase(user.getStatus()))
                .ifPresent(user -> {
                    if (SecurityContextHolder.getContext().getAuthentication() == null) {
                        KbUserPrincipal principal = KbUserPrincipal.from(user);
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                });

        filterChain.doFilter(request, response);
    }
}
