V kavarna-holubnik.pdf je v část III. popsána vize naší kavárny. Chci na základě problémových domén texty z této části extrahovat do samostatných MD souborů. Celé to bude fungovat jako skill. Skill bude uložen ve složce .github/skills jako vize-kavarny složka, ve které bude SKILL.md společně se všemi MD soubory. 

PDF se tedy rozdělí do samostatných MD souborů, každý se pojmenuje podle-problemove-oblasti.md. SKILL.md bude definován jako stručné strukturované shrnutí. Bude obsahovat účel skillu, kdy se má použít a bude obsahovat tabulku s odkazem na jednotlivé MD, jejich názvy a popisy. Tento skill bude výhradně user-invocable a LLM ho nebude volat automaticky.

- nikde neuváděj odkaz na původní PDF soubor
- soubory MD uvnitř skillu budou ve složce docs (o úroveň níže než SKILL.md)

Specifikace skills

- https://agentskills.io/specification