package com.example.kb.exception;

public class NotFoundException extends BizException {

    public NotFoundException(String message) {
        super("KB-20001", message);
    }
}
