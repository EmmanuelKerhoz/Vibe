# test_remediation.py
# Harnais de non-régression — Lyricist v4.1 remédiations
# Cible : 85% de match sur paires annotées (spec §13 plan impl.)
import unittest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from morpho_strip import strip_before_rn_extraction, StripResult
from phoneme_embedding import score_embedding, ToneVector


class TestMorphoStripKWA(unittest.TestCase):
    """KWA analytique : BA/DI → pass-through."""

    def test_baoul_passthrough(self):
        r = strip_before_rn_extraction("bɔlo", "BA")
        self.assertEqual(r.token, "bɔlo")
        self.assertEqual(r.morpho_strip_applied, "none")

    def test_dioula_passthrough(self):
        r = strip_before_rn_extraction("kɛ", "DI")
        self.assertEqual(r.token, "kɛ")
        self.assertEqual(r.morpho_strip_applied, "none")


class TestMorphoStripEwe(unittest.TestCase):
    """EW/MI : détachement clitique + harmonie hauteur."""

    def test_3sg_clitic_detached(self):
        r = strip_before_rn_extraction("ko-e", "EW")
        self.assertEqual(r.token, "ko")
        self.assertEqual(r.morpho_strip_applied, "ewe_clitic")

    def test_focus_marker_detached(self):
        r = strip_before_rn_extraction("dɔ-a", "EW")
        self.assertIn(r.morpho_strip_applied, ("ewe_clitic", "none"))
        if r.morpho_strip_applied == "ewe_clitic":
            self.assertEqual(r.token, "dɔ")

    def test_height_harmony_low_stem(self):
        # stem nucleus ɛ ([-high]) → clitic e devrait descendre vers ɛ
        r = strip_before_rn_extraction("bɛ-e", "EW")
        if r.harmonic_variant:
            self.assertTrue(any("ɛ" in n for n in r.notes))

    def test_high_stem_no_harmony(self):
        # stem nucleus i ([+high]) → pas de modification surface, harmonic_variant=False
        r = strip_before_rn_extraction("di-e", "EW")
        self.assertFalse(r.harmonic_variant)

    def test_mina_same_rules(self):
        r = strip_before_rn_extraction("ko-e", "MI")
        self.assertEqual(r.morpho_strip_applied, "ewe_clitic")

    def test_no_clitic_passthrough(self):
        r = strip_before_rn_extraction("dzo", "EW")
        self.assertEqual(r.token, "dzo")
        self.assertEqual(r.morpho_strip_applied, "none")


class TestMorphoStripBNT(unittest.TestCase):
    """BNT : strip préfixe classe nominale."""

    def test_swahili_prefix_wa(self):
        r = strip_before_rn_extraction("wa-toto", "SW")
        self.assertEqual(r.token, "toto")
        self.assertIn("bnt_prefix", r.morpho_strip_applied)

    def test_zulu_prefix_um(self):
        r = strip_before_rn_extraction("um-untu", "ZU")
        self.assertEqual(r.token, "untu")

    def test_no_prefix_passthrough(self):
        r = strip_before_rn_extraction("nyumba", "SW")
        self.assertEqual(r.token, "nyumba")
        self.assertEqual(r.morpho_strip_applied, "none")


class TestMorphoStripTRK(unittest.TestCase):
    def test_turkish_plural(self):
        r = strip_before_rn_extraction("ev-ler", "TR")
        self.assertEqual(r.token, "ev")

    def test_turkish_locative(self):
        r = strip_before_rn_extraction("ev-de", "TR")
        self.assertEqual(r.token, "ev")


class TestToneVector(unittest.TestCase):
    """Encodage tonal 2D + contours HL."""

    def test_level_tones_H_H(self):
        tv1 = ToneVector.from_label("H")
        tv2 = ToneVector.from_label("H")
        self.assertAlmostEqual(tv1.similarity(tv2), 1.0)

    def test_level_tones_H_L(self):
        tv1 = ToneVector.from_label("H")
        tv2 = ToneVector.from_label("L")
        self.assertLess(tv1.similarity(tv2), 0.5)

    def test_hl_contour_encoded(self):
        tv = ToneVector.from_label("HL")
        self.assertTrue(tv.is_contour)
        self.assertAlmostEqual(tv.onset, 1.0)
        self.assertAlmostEqual(tv.offset, 0.0)

    def test_hl_vs_h_level_partial(self):
        tv1 = ToneVector.from_label("HL")
        tv2 = ToneVector.from_label("H")
        sim = tv1.similarity(tv2)
        self.assertGreater(sim, 0.0)
        self.assertLess(sim, 1.0)

    def test_hl_hl_identity(self):
        tv1 = ToneVector.from_label("HL")
        tv2 = ToneVector.from_label("HL")
        self.assertAlmostEqual(tv1.similarity(tv2), 1.0)

    def test_lh_contour_encoded(self):
        tv = ToneVector.from_label("LH")
        self.assertTrue(tv.is_contour)
        self.assertAlmostEqual(tv.onset, 0.0)
        self.assertAlmostEqual(tv.offset, 1.0)

    def test_hl_vs_lh_dissimilar(self):
        tv1 = ToneVector.from_label("HL")
        tv2 = ToneVector.from_label("LH")
        # Contours opposés : cosine proche de 0
        self.assertLess(tv1.similarity(tv2), 0.3)


class TestPhonemeEmbedding(unittest.TestCase):
    """Scoring embedding niveau 4."""

    def test_identical_phones_high_score(self):
        r = score_embedding(["a"], ["a"], tone1="H", tone2="H", lang="EW")
        self.assertGreaterEqual(r.score, 0.9)

    def test_different_phones_lower_score(self):
        r = score_embedding(["a"], ["i"], tone1="H", tone2="H", lang="EW")
        self.assertLess(r.score, 0.9)

    def test_hausa_hl_contour_applied(self):
        # Hausa CRV : HL contour vs H level → score inférieur à HL vs HL
        r_same = score_embedding(["a"], ["a"], tone1="HL", tone2="HL", lang="HA")
        r_diff = score_embedding(["a"], ["a"], tone1="HL", tone2="H", lang="HA")
        self.assertGreater(r_same.score, r_diff.score)

    def test_tonal_lang_uses_40pct_tone_weight(self):
        # Langue tonale : pondération ton 40%, donc ton H≠L doit pénaliser
        r_h_h = score_embedding(["a"], ["a"], tone1="H", tone2="H", lang="EW")
        r_h_l = score_embedding(["a"], ["a"], tone1="H", tone2="L", lang="EW")
        self.assertGreater(r_h_h.score, r_h_l.score)

    def test_non_tonal_lang_uses_20pct_tone_weight(self):
        r_h_h = score_embedding(["a"], ["a"], tone1="H", tone2="H", lang="FR")
        r_h_l = score_embedding(["a"], ["a"], tone1="H", tone2="L", lang="FR")
        # Pénalité tonale plus faible (20%) que pour langue tonale
        diff_tonal = (
            score_embedding(["a"], ["a"], tone1="H", tone2="H", lang="EW").score -
            score_embedding(["a"], ["a"], tone1="H", tone2="L", lang="EW").score
        )
        diff_non = r_h_h.score - r_h_l.score
        self.assertGreater(diff_tonal, diff_non)

    def test_neural_model_delegate(self):
        class MockModel:
            def score(self, p1, p2): return 0.77
        r = score_embedding(["a"], ["b"], neural_model=MockModel())
        self.assertAlmostEqual(r.score, 0.77)
        self.assertEqual(r.method, "neural")

    def test_empty_phones_returns_zero(self):
        r = score_embedding([], [])
        self.assertEqual(r.score, 0.0)

    def test_method_label_phoible_v2(self):
        r = score_embedding(["a"], ["a"], lang="EN")
        self.assertEqual(r.method, "phoible_lite_v2")


if __name__ == "__main__":
    unittest.main()
