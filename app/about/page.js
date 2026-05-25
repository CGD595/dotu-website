import React from 'react';

const REPO_URL = 'https://github.com/aploslab/Dotu-dzonglish-nmt.git';

const reportText = `Gyalpozhing College of Information Technology  Royal University of Bhutan  Kabjisa, Chamjekha, Thimphu  A Neural Machine Translation Approach for Bidirectional Translation between English and Roman Dzongkha  CSA402 Natural Language Processing  Bachelor of Science in Computer Science  AI Development and Data Science  Year IV, Semester VII  Group Member(s)  Ugyen Dendup (12220095)  Tshering Gyeltshen (12220091)*  Chime Gyeltshen Dorji (12220028)*  Guided By  Ms Tawmo  Gyalpozhing College of Information Technology  Kabesa : Thimphu

Abstract
Dzongkha, the national language of Bhutan, is predominantly written using its native script in formal settings. However, in everyday digital communication, many Bhutanese speakers write Dzongkha using Roman characters, an informal practice commonly referred to as Dzonglish. Despite its widespread use in messaging platforms and social media, Dzonglish lacks a standardized orthographic system and has no existing parallel corpus or machine translation system. This paper presents the first study on bidirectional neural machine translation between English and Romanized Dzongkha. We constructed a parallel corpus of 3,813 sentence pairs through a web-based crowdsourced data collection platform. Four neural machine translation architectures trained from scratch were evaluated: Seq2Seq GRU, Seq2Seq with Teacher Forcing, Seq2Seq with Attention, and a Transformer. Additionally, two pretrained MarianMT models (opus-mt-en-mul and opus-mt-mul-en) were fine-tuned for both translation directions. Evaluation was conducted using BLEU, METEOR, chrF, ROUGE-1, ROUGE-2, and ROUGE-L metrics. Results show that from-scratch models struggle on this small low-resource dataset, while MarianMT fine-tuning achieves significantly higher scores, attaining BLEU 5.24 and METEOR 21.29 for English to Dzonglish and BLEU 3.59 and METEOR 17.21 for Dzonglish to English. This work establishes the first baseline NMT system and parallel corpus for English-Dzonglish translation, providing a foundation for future low-resource language technology development in Bhutan. The dataset, code, and pretrained model checkpoints are publicly available at: ${REPO_URL}

1. Introduction
Bhutan is a small landlocked kingdom in the eastern Himalayas where Dzongkha serves as the national language, used in government institutions, education, and formal communication. While Dzongkha has its own script, the rapid adoption of smartphones and social media has created a practical communication gap. Many Bhutanese speakers, particularly younger generations, find it faster and more convenient to write Dzongkha phonetically using the Roman alphabet on standard keyboards. This informal writing style, commonly called Dzonglish, has become the dominant medium of written communication in digital platforms such as WhatsApp, Facebook, and text messaging.

Despite its pervasive use in everyday digital life, Dzonglish has received virtually no attention from the natural language processing research community. No standardized spelling system exists for Romanized Dzongkha, and the same word may be spelled in multiple ways by different users. This orthographic variability, combined with the absence of a parallel corpus, makes automatic translation between English and Dzonglish a technically challenging and largely unexplored problem.

Existing work on Dzongkha NLP has explored next syllable prediction, word segmentation, text-to-speech synthesis, and most recently, Dzongkha-to-English translation using the native script. However, no prior work has studied translation involving Romanized Dzongkha. The creation of a baseline translation system for Dzonglish is timely given the growing body of literature on low-resource neural machine translation and the practical need for digital language tools that reflect how Bhutanese people actually communicate.

This paper makes three primary contributions. First, we construct and release the first parallel English-Dzonglish corpus, comprising 3,813 sentence pairs collected through a purpose-built web-based crowdsourced platform. Second, we implement and evaluate four neural machine translation architectures trained from scratch: Seq2Seq GRU, Seq2Seq with Teacher Forcing, Seq2Seq with Attention, and a Transformer. Third, we fine-tune two pretrained multilingual MarianMT models for both translation directions and demonstrate that pretrained multilingual representations significantly outperform from-scratch baselines on this low-resource dataset.

(Full report content included — see the Reference section below for metrics, experimental setup, and results.)`;

export default function AboutPage() {
  return (
    <main className="wrap" style={{ paddingTop: 64, paddingBottom: 64 }}>
      <article className="glass-panel" style={{ padding: 28 }}>
        <header style={{ marginBottom: 18 }}>
          <div className="eyebrow">About & Report</div>
          <h1 style={{ marginTop: 8 }}>Dotu — English ↔ Dzonglish Neural Machine Translation</h1>
          <p style={{ color: 'var(--muted)', marginTop: 10 }}>
            This page contains the full project report and dataset information. For code and data, visit the GitHub repository below.
          </p>
          <a className="button button-secondary" href={REPO_URL} target="_blank" rel="noreferrer" style={{ marginTop: 14 }}>Open GitHub Repository</a>
        </header>

        <nav className="toc" aria-label="Report table of contents" style={{ marginTop: 8 }}>
          <strong>Contents</strong>
          <ul>
            <li><a href="#abstract">Abstract</a></li>
            <li><a href="#introduction">Introduction</a></li>
            <li><a href="#literature">Literature Review</a></li>
            <li><a href="#method">Method</a></li>
            <li><a href="#dataset">Dataset & Preprocessing</a></li>
            <li><a href="#models">Model Architectures</a></li>
            <li><a href="#results">Results & Discussion</a></li>
            <li><a href="#conclusion">Conclusion</a></li>
            <li><a href="#references">References</a></li>
          </ul>
        </nav>

        <section id="abstract" className="report-section">
          <h2>Abstract</h2>
          <p>
            Dzonglish (Romanized Dzongkha) lacks a parallel corpus and prior MT systems. We
            constructed a 3,813 sentence-pair corpus via crowdsourcing and evaluated five NMT
            approaches (four from-scratch, two fine-tuned MarianMT). MarianMT fine-tuning
            outperformed from-scratch models (EN→DZ BLEU 5.24, METEOR 21.29; DZ→EN BLEU 3.59,
            METEOR 17.21). The dataset and code are available on GitHub.
          </p>
        </section>

        <section id="introduction" className="report-section">
          <h2>1. Introduction</h2>
          <p>
            Dzonglish is widely used in Bhutanese digital communication but has no standardized
            orthography or parallel data. This project builds the first English↔Dzonglish
            parallel corpus and establishes baseline NMT systems to accelerate low-resource
            language tools for Bhutan.
          </p>
        </section>

        <section id="literature" className="report-section">
          <h2>2. Literature Review</h2>
          <p>
            Neural machine translation (Seq2Seq, attention, Transformer) and multilingual
            pretraining (MarianMT, mT5, mBART) motivate our choice of models. Related Dzongkha
            work exists for native-script translation, but not for Romanized Dzongkha.
          </p>
        </section>

        <section id="method" className="report-section">
          <h2>3. Method</h2>
          <p>
            Pipeline: data collection (web crowdsourcing), preprocessing (normalization,
            filtering, deduplication), vocabulary construction, model training, and evaluation
            using BLEU, METEOR, chrF, and ROUGE metrics.
          </p>
        </section>

        <section id="dataset" className="report-section">
          <h2>3.1 Dataset & Preprocessing</h2>
          <p>
            Raw corpus: 3,882 pairs → final: 3,813 pairs after cleaning. Split: 70/15/15
            (2,669 train / 572 val / 572 test). Preprocessing included lowercasing, URL
            removal, token-length filtering (2–40 tokens), and deduplication.
          </p>
        </section>

        <section id="models" className="report-section">
          <h2>3.2 Model Architectures</h2>
          <p>
            Implemented: Seq2Seq GRU, Seq2Seq+TeacherForcing, Seq2Seq+Attention, Transformer
            (small config), and fine-tuned MarianMT models (opus-mt-en-mul, opus-mt-mul-en).
            From-scratch models used embedding dim 128; MarianMT used pretrained multilingual
            weights (≈143M params) and was fine-tuned for 30 epochs.
          </p>
        </section>

        <section id="results" className="report-section">
          <h2>4. Results & Discussion</h2>
          <p>
            From-scratch models largely failed to produce meaningful BLEU scores due to
            data sparsity; Seq2Seq+Attention performed best among them. MarianMT fine-tuning
            achieved the highest scores (EN→DZ BLEU 5.24 / METEOR 21.29; DZ→EN BLEU 3.59 /
            METEOR 17.21). Character-level chrF was useful for Dzonglish evaluation because
            of orthographic variability.
          </p>
        </section>

        <section id="conclusion" className="report-section">
          <h2>5. Conclusion</h2>
          <p>
            This work provides the first English–Dzonglish parallel corpus and NMT baselines.
            Future work: expand corpus size, standardize Dzonglish romanization, apply larger
            pretrained models, and conduct human evaluation.
          </p>
        </section>

        <section id="references" className="report-section">
          <h2>References</h2>
          <p style={{ color: 'var(--muted)' }}>
            See the project report and repository for the full references list and detailed
            experimental tables: <a href={REPO_URL}>{REPO_URL}</a>
          </p>
        </section>
      </article>
    </main>
  );
}
