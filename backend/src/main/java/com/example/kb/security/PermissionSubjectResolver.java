package com.example.kb.security;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class PermissionSubjectResolver {

    public Set<String> resolve(KbUserPrincipal principal) {
        LinkedHashSet<String> subjects = new LinkedHashSet<>();
        if (principal == null) {
            return subjects;
        }

        if (principal.getUserId() != null && !principal.getUserId().isBlank()) {
            subjects.add("user:" + principal.getUserId().trim().toLowerCase(Locale.ROOT));
        }
        if (principal.getUsername() != null && !principal.getUsername().isBlank()) {
            subjects.add("user:" + principal.getUsername().trim().toLowerCase(Locale.ROOT));
        }
        if (principal.getRoleCode() != null && !principal.getRoleCode().isBlank()) {
            subjects.add("role:" + principal.getRoleCode().trim().toLowerCase(Locale.ROOT));
        }

        return subjects;
    }
}