"""Intent classifier — stub (keyword-based) with LLM provider interface."""

from enum import Enum


class Intent(str, Enum):
    QUALIFICACAO = "qualificacao"
    ATENDIMENTO = "atendimento"
    AGENDAMENTO = "agendamento"
    VENDA = "venda"
    INDEFINIDA = "indefinida"


# Keyword mappings for the stub classifier
_KEYWORD_MAP: dict[Intent, list[str]] = {
    Intent.AGENDAMENTO: [
        "agendar", "agendamento", "marcar", "horário", "horario", "data disponível",
        "disponibilidade", "reservar", "agenda",
    ],
    Intent.ATENDIMENTO: [
        "atendimento", "suporte", "ajuda", "problema", "reclamação", "reclamar",
        "erro", "bug", "defeito", "não funciona",
    ],
    Intent.VENDA: [
        "comprar", "venda", "preço", "valor", "quanto custa", "orçamento",
        "proposta", "contratar", "plano",
    ],
    Intent.INDEFINIDA: [
        "oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "hey",
        "hello", "tudo bem", "e aí", "eai",
    ],
}


def classify_stub(message: str) -> Intent:
    """Keyword-based stub classifier. Returns an Intent enum value.

    Priority: qualificacao is the default if no other keywords match
    and the message is not a greeting (indefinida).
    """
    msg_lower = message.lower().strip()

    # Check each intent's keywords
    for intent, keywords in _KEYWORD_MAP.items():
        if intent == Intent.INDEFINIDA:
            continue  # check greetings last
        for kw in keywords:
            if kw in msg_lower:
                return intent

    # Check greetings (indefinida)
    for kw in _KEYWORD_MAP[Intent.INDEFINIDA]:
        if kw in msg_lower:
            return Intent.INDEFINIDA

    # Default: qualificacao (the most common real intent)
    return Intent.QUALIFICACAO


async def classify_intent(message: str, mode: str = "stub") -> Intent:
    """Classify a message's intent.

    Args:
        message: The user's message text.
        mode: "stub" for keyword-based, "llm" for LLM-based.

    Returns:
        Intent enum value.
    """
    if mode == "llm":
        # Will be implemented in Step 14
        from app.services.llm_provider import classify_with_llm
        return await classify_with_llm(message)

    return classify_stub(message)
