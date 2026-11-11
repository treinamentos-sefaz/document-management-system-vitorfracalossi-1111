---
description: Sugere uma mensagem de commit em português com base nas alterações do repositório.
name: mensagem-commit
argument-hint: orientação opcional sobre a mensagem
agent: commit-msg
---

Analise as alterações relevantes do Git e sugira uma mensagem de commit em português, seguindo Conventional Commits quando apropriado. Considere esta orientação adicional, se fornecida: ${input:orientacao:nenhuma}.

Retorne somente a mensagem sugerida em um bloco de código. Não crie o commit nem altere o repositório.