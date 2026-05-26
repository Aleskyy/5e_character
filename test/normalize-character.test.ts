import { describe, it, expect } from "vitest";
import { normalizeCharacter } from "~/utils/character";

describe("normalizeCharacter", () => {
  it("migrates legacy scalar class into classes[]", () => {
    const out = normalizeCharacter({
      id: "x", classId: "class:phb:wizard", subclassId: "sub:phb:evoker", level: 3,
    });
    expect(out.classes).toEqual([
      { classId: "class:phb:wizard", subclassId: "sub:phb:evoker", level: 3 },
    ]);
    expect(out.level).toBe(3);
  });

  it("recomputes total level from multiple classes", () => {
    const out = normalizeCharacter({
      classes: [
        { classId: "a", subclassId: "", level: 3 },
        { classId: "b", subclassId: "", level: 2 },
      ],
    });
    expect(out.level).toBe(5);
    expect(out.classId).toBe("a");
  });

  it("is idempotent", () => {
    const once = normalizeCharacter({ classId: "a", level: 2 });
    const twice = normalizeCharacter(once);
    expect(twice.classes).toEqual(once.classes);
    expect(twice.level).toBe(once.level);
  });

  it("keeps manual level when there is no class", () => {
    const out = normalizeCharacter({ level: 4 });
    expect(out.classes).toEqual([]);
    expect(out.level).toBe(4);
  });

  it("maps legacy gold into currency", () => {
    const out = normalizeCharacter({ gold: 15 } as never);
    expect(out.currency.gp).toBe(15);
  });
});
