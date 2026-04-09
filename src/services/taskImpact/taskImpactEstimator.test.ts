import { describe, expect, it } from "vitest";
import {
  estimateTaskImpactFromCategoryName,
  estimateVersionedTaskImpactFromCategoryName,
} from "./taskImpactEstimator";

describe("taskImpactEstimator", () => {
  it("returns mapped deltas for Travail", () => {
    expect(estimateTaskImpactFromCategoryName("Travail")).toEqual({
      fatigue: 4,
      stress: 3,
      joie: -1,
      sante: 0,
      motivation: 2,
      finances: 1,
    });
  });

  it("returns mapped deltas for Sante, including accented input", () => {
    expect(estimateTaskImpactFromCategoryName("Santé")).toEqual({
      fatigue: -2,
      stress: -1,
      joie: 1,
      sante: 3,
      motivation: 1,
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
      fatigue: 3,
      stress: 2,
      joie: 1,
      sante: 1,
      motivation: 2,
      finances: -1,
    });
  });

  it("returns mapped deltas for Social", () => {
    expect(estimateTaskImpactFromCategoryName("Social")).toEqual({
      fatigue: -2,
      stress: -2,
      joie: 3,
      sante: 1,
      motivation: 1,
      finances: -1,
    });
  });

  it("returns mapped deltas for Maison", () => {
    expect(estimateTaskImpactFromCategoryName("Maison")).toEqual({
      fatigue: 2,
      stress: -1,
      joie: 1,
      sante: 1,
      motivation: 1,
      finances: -1,
    });
  });

  it("returns mapped deltas for Loisirs", () => {
    expect(estimateTaskImpactFromCategoryName("Loisirs")).toEqual({
      fatigue: -3,
      stress: -2,
      joie: 3,
      sante: 1,
      motivation: 1,
      finances: -1,
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
        fatigue: 4,
        stress: 3,
        joie: -1,
        sante: 0,
        motivation: 2,
        finances: 1,
      },
    });
  });
});
