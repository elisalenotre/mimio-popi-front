import { describe, expect, it } from "vitest";
import {
  estimateTaskImpactFromCategoryName,
  estimateVersionedTaskImpactFromCategoryName,
} from "./taskImpactEstimator";

describe("taskImpactEstimator", () => {
  it("returns mapped deltas for Travail", () => {
    expect(estimateTaskImpactFromCategoryName("Travail")).toEqual({
      fatigue: 9,
      stress: 8,
      joie: -5,
      sante: 0,
      motivation: 7,
      finances: 6,
    });
  });

  it("returns mapped deltas for Sante, including accented input", () => {
    expect(estimateTaskImpactFromCategoryName("Santé")).toEqual({
      fatigue: -7,
      stress: -6,
      joie: 5,
      sante: 10,
      motivation: 6,
      finances: 0,
    });
  });

  it("returns neutral impact for empty category", () => {
    expect(estimateTaskImpactFromCategoryName(null)).toEqual({
      fatigue: 0,
      stress: 0,
      joie: 0,
      sante: 0,
      motivation: 0,
      finances: 0,
    });
  });

  it("returns mapped deltas for Etudes", () => {
    expect(estimateTaskImpactFromCategoryName("Études")).toEqual({
      fatigue: 8,
      stress: 7,
      joie: 5,
      sante: 5,
      motivation: 9,
      finances: -5,
    });
  });

  it("returns mapped deltas for Social", () => {
    expect(estimateTaskImpactFromCategoryName("Social")).toEqual({
      fatigue: -6,
      stress: -7,
      joie: 8,
      sante: 5,
      motivation: 5,
      finances: -5,
    });
  });

  it("returns mapped deltas for Maison", () => {
    expect(estimateTaskImpactFromCategoryName("Maison")).toEqual({
      fatigue: 6,
      stress: -5,
      joie: 5,
      sante: 5,
      motivation: 6,
      finances: -5,
    });
  });

  it("returns mapped deltas for Loisirs", () => {
    expect(estimateTaskImpactFromCategoryName("Loisirs")).toEqual({
      fatigue: -8,
      stress: -7,
      joie: 9,
      sante: 5,
      motivation: 6,
      finances: -5,
    });
  });

  it("returns neutral impact for unknown categories", () => {
    expect(estimateTaskImpactFromCategoryName("UnknownCategory")).toEqual({
      fatigue: 0,
      stress: 0,
      joie: 0,
      sante: 0,
      motivation: 0,
      finances: 0,
    });
  });

  it("returns versioned impact payload for storage", () => {
    expect(estimateVersionedTaskImpactFromCategoryName("Travail")).toEqual({
      version: "v1",
      deltas: {
        fatigue: 9,
        stress: 8,
        joie: -5,
        sante: 0,
        motivation: 7,
        finances: 6,
      },
    });
  });
});
