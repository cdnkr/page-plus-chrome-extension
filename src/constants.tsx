import { AiModel } from "./types/aiProvider"

export const SUPPORTED_MODELS: { [key: string]: AiModel } = {
  GEMINI_2_5_PRO: 'gemini-2.5-pro',
  GEMINI_2_5_FLASH_LITE: 'gemini-2.5-flash-lite',
  GEMINI_NANO: 'gemini-nano'
}

export const CONTEXT_CHAR_DISPLAY_LIMIT = 80
export const SHOW_SUGGESTIONS = true
export const USE_GENERIC_SUGGESTIONS = false
export const DEFAULT_SUMMARY_MODEL: AiModel = SUPPORTED_MODELS.GEMINI_2_5_FLASH_LITE
export const TEXTAREA_PER_ROW = 45
export const CONVERSATION_COMPONENT_PREFIX = '__PAGEPLUS__'
export const API_URL = 'https://api-holy-frog-5486.fly.dev'
export const AUTO_SUMMARIZE_THRESHOLD = 2000

export const GENERIC_PAGE_SUGGESTIONS = {
  en: [
    {
      title: "Summarize this page",
      description: "Get a clear overview of the page’s purpose, audience, and key points.",
      prompt: "Provide a concise summary with: purpose, audience, 5 bullet highlights, and a one-sentence TL;DR."
    },
    {
      title: "Key takeaways",
      description: "See the most important facts, dates, numbers, and calls to action.",
      prompt: "List the top 5–7 takeaways with brief notes on why they matter. Include any deadlines, prices, or requirements."
    },
    {
      title: "Explain in simple terms",
      description: "Turn jargon into plain language and define acronyms.",
      prompt: "Rewrite the page’s main points in simple language. Define acronyms and terms. Provide 3–5 short bullets."
    },
    {
      title: "What can I do here?",
      description: "Identify actions available on this page and how to complete them.",
      prompt: "List actionable tasks (e.g., sign up, download, contact). For each, give step-by-step instructions and the link/button text."
    },
    {
      title: "Find help and support",
      description: "Locate support articles, contact options, and FAQs relevant to this page.",
      prompt: "Find the most relevant help/support resources on or linked from this page, with titles, URLs, and when to use each."
    },
    {
      title: "Extract important links",
      description: "Collect official links: docs, pricing, downloads, contact, and next steps.",
      prompt: "Extract key links with titles and URLs grouped by category: Docs, Pricing, Download, Contact, FAQ, Get Started."
    },
    {
      title: "Draft a quick reply",
      description: "Generate a short message I can send referencing this page.",
      prompt: "Draft a concise email or chat message asking for more info/help about this page. Include a subject and a short body with specific questions."
    },
    {
      title: "Compare options on this page",
      description: "If plans/products are listed, compare them at a glance.",
      prompt: "If the page lists options, produce a comparison with names, features, limits, price, pros, and best for. If not applicable, say so."
    },
    {
      title: "Pros and cons",
      description: "Summarize benefits, drawbacks, and any risks or caveats.",
      prompt: "List 3–5 pros and 3–5 cons based on the page content. Include any notable risks or caveats."
    },
    {
      title: "Extract key data",
      description: "Pull names, contacts, dates, prices, and requirements.",
      prompt: "Extract structured details: names, emails, phone numbers, dates/deadlines, prices, requirements, and relevant URLs."
    }
  ],

  es: [
    {
      title: "Resumir esta página",
      description: "Obtén una visión clara del propósito, público y puntos clave de la página.",
      prompt: "Proporciona un resumen conciso que incluya: propósito, público, 5 puntos destacados y una frase final (TL;DR)."
    },
    {
      title: "Puntos clave",
      description: "Consulta los hechos, fechas, cifras y llamados a la acción más importantes.",
      prompt: "Enumera los 5–7 puntos más importantes con una breve explicación de por qué son relevantes. Incluye plazos, precios o requisitos si los hay."
    },
    {
      title: "Explicar en términos simples",
      description: "Convierte el lenguaje técnico en lenguaje claro y define los acrónimos.",
      prompt: "Reescribe los puntos principales de la página en lenguaje sencillo. Define los acrónimos y términos. Proporciona de 3 a 5 viñetas cortas."
    },
    {
      title: "¿Qué puedo hacer aquí?",
      description: "Identifica las acciones disponibles en esta página y cómo realizarlas.",
      prompt: "Enumera las tareas que se pueden realizar (por ejemplo, registrarse, descargar, contactar). Para cada una, incluye instrucciones paso a paso y el texto del enlace o botón."
    },
    {
      title: "Buscar ayuda y soporte",
      description: "Encuentra artículos de soporte, opciones de contacto y preguntas frecuentes relacionadas con esta página.",
      prompt: "Busca los recursos de ayuda o soporte más relevantes en esta página o enlazados desde ella, con títulos, URLs y cuándo usar cada uno."
    },
    {
      title: "Extraer enlaces importantes",
      description: "Recopila enlaces oficiales: documentación, precios, descargas, contacto y próximos pasos.",
      prompt: "Extrae los enlaces clave con títulos y URLs agrupados por categoría: Documentación, Precios, Descargas, Contacto, FAQ, Empezar."
    },
    {
      title: "Redactar una respuesta rápida",
      description: "Genera un mensaje breve que pueda enviar haciendo referencia a esta página.",
      prompt: "Redacta un correo o mensaje de chat conciso solicitando más información o ayuda sobre esta página. Incluye un asunto y un cuerpo corto con preguntas específicas."
    },
    {
      title: "Comparar opciones en esta página",
      description: "Si hay planes o productos, compáralos de un vistazo.",
      prompt: "Si la página muestra opciones, crea una comparación con nombres, características, límites, precios, ventajas y para quién es mejor. Si no aplica, indícalo."
    },
    {
      title: "Pros y contras",
      description: "Resume los beneficios, desventajas y posibles riesgos o advertencias.",
      prompt: "Enumera de 3 a 5 pros y de 3 a 5 contras basados en el contenido de la página. Incluye cualquier riesgo o advertencia notable."
    },
    {
      title: "Extraer datos clave",
      description: "Obtén nombres, contactos, fechas, precios y requisitos.",
      prompt: "Extrae detalles estructurados: nombres, correos electrónicos, números de teléfono, fechas o plazos, precios, requisitos y URLs relevantes."
    }
  ],

  ja: [
    {
      title: "このページを要約する",
      description: "ページの目的、対象読者、重要なポイントを明確に把握します。",
      prompt: "次の内容を含む簡潔な要約を作成してください：目的、対象読者、5つの重要ポイント、そして1文のまとめ（TL;DR）。"
    },
    {
      title: "重要なポイント",
      description: "最も重要な事実、日付、数値、行動項目を確認します。",
      prompt: "最も重要な5～7項目を挙げ、それぞれの重要性を簡単に説明してください。締め切り、価格、要件などがあれば含めてください。"
    },
    {
      title: "わかりやすく説明する",
      description: "専門用語をやさしい言葉に言い換え、略語を定義します。",
      prompt: "ページの主な内容を簡単な言葉で書き直してください。略語や専門用語を定義し、3〜5個の短い箇条書きを示してください。"
    },
    {
      title: "ここでできること",
      description: "このページでできる操作と、その方法を特定します。",
      prompt: "実行可能なタスク（例：登録、ダウンロード、問い合わせ）をリスト化し、それぞれについて手順とリンク／ボタンのテキストを示してください。"
    },
    {
      title: "ヘルプとサポートを探す",
      description: "このページに関連するサポート記事、連絡先、FAQを見つけます。",
      prompt: "このページまたはリンク先から関連するサポート／ヘルプリソースを探し、タイトル、URL、利用する場面を示してください。"
    },
    {
      title: "重要なリンクを抽出する",
      description: "公式リンク（ドキュメント、価格、ダウンロード、連絡先、次のステップ）を収集します。",
      prompt: "主要なリンクをカテゴリ別（ドキュメント、価格、ダウンロード、連絡先、FAQ、開始方法）にタイトルとURL付きで抽出してください。"
    },
    {
      title: "簡単な返信を作成する",
      description: "このページを参照した短いメッセージを生成します。",
      prompt: "このページに関する追加情報やサポートを求める簡潔なメールまたはチャットメッセージを作成してください。件名と具体的な質問を含む短い本文を加えてください。"
    },
    {
      title: "ページ上のオプションを比較する",
      description: "プランや製品がある場合、それらを簡単に比較します。",
      prompt: "ページにオプションがある場合、それぞれの名前、特徴、制限、価格、利点、適した利用者を含む比較表を作成してください。該当しない場合はその旨を記載してください。"
    },
    {
      title: "長所と短所",
      description: "利点、欠点、およびリスクや注意点をまとめます。",
      prompt: "ページ内容に基づき、3〜5の長所と3〜5の短所を挙げてください。特筆すべきリスクや注意点も含めてください。"
    },
    {
      title: "主要データを抽出する",
      description: "名前、連絡先、日付、価格、要件を抽出します。",
      prompt: "構造化された詳細情報（名前、メール、電話番号、日付／締め切り、価格、要件、関連URL）を抽出してください。"
    }
  ],
}
