package com.example.kb.rewrite;

import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class HeuristicQueryRewriteService implements QueryRewriteService {

    @Override
    public QueryRewriteResult rewrite(String query) {
        String normalized = normalize(query);
        String rewritten = normalized;
        rewritten = rewritten.replace("需要哪些材料", "申请材料 清单");
        rewritten = rewritten.replace("要哪些材料", "申请材料 清单");
        rewritten = rewritten.replace("怎么审批", "审批流程 要求");
        rewritten = rewritten.replace("如何审批", "审批流程 要求");
        rewritten = rewritten.replace("是什么", "定义 说明");
        return new QueryRewriteResult(query, rewritten);
    }

    private String normalize(String query) {
        String text = query == null ? "" : query.trim();
        text = text.replace('？', ' ').replace('?', ' ').replace('，', ' ').replace(',', ' ');
        text = text.replaceAll("\\s+", " ");
        return text.toLowerCase(Locale.ROOT).trim();
    }
}
