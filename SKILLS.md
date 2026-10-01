---
name: global-svelte-coding-style
description: Global coding and architecture baseline for local Svelte and SvelteKit projects, including Svelte 5, TypeScript, Prisma, Zod, security, UI, PWA, documentation, and testing. Load when creating, changing, reviewing, or designing code in this ecosystem.
Global Svelte Coding Style
Gunakan skill ini sebagai baseline global untuk proyek Svelte dan SvelteKit di lokal ini. Aturan ini menjaga kode tetap aman, mudah dicari, konsisten, accessible, dan mudah dipelihara tanpa menambah abstraksi yang belum diperlukan.
Aturan ini adalah default, bukan alasan untuk mengabaikan kontrak proyek. Sebelum mengubah kode existing, analisis struktur folder, package manager, versi SvelteKit, pola penamaan, konfigurasi formatter, serta ritme penulisan terdekat. Ikuti pola lokal bila tidak bertentangan dengan correctness, keamanan, atau kontrak framework.
1. Prioritas keputusan
Jika aturan berbenturan, gunakan urutan berikut:
Correctness, keamanan, privasi, dan integritas data.
Kontrak SvelteKit serta batas server/client.
Kesesuaian dengan SRS, PRD, desain, dan domain proyek.
Konsistensi dengan struktur serta pola existing terdekat.
Kejelasan lokal, accessibility, dan kemudahan perubahan.
Reuse dan optimasi performa yang memiliki bukti.
Jangan melakukan refactor massal hanya untuk merapikan style. Saat menyentuh kode lama, perbaiki pola lokal yang berisiko bila perubahan tetap berada dalam scope. Jangan meninggalkan alias, compatibility shim, folder kosong, placeholder, branch no-op, atau TODO implementasi.
Bila kebutuhan, SRS/PRD, database, versi library, atau konvensi proyek saling bertentangan dan tidak dapat ditentukan dari repository, berhenti pada keputusan yang ambigu dan minta konfirmasi. Jangan menebak kontrak bisnis atau memilih teknologi database tanpa dasar.
2. Package manager, runtime, dan pemeriksaan dependency
Bun adalah default wajib
Utamakan Bun untuk setiap aksi proyek:
Inisialisasi: `bun create`, `bunx sv`, atau generator resmi yang dijalankan melalui `bunx`.
Install dan update dependency: `bun install`, `bun add`, `bun remove`, `bun update`.
Menjalankan script: `bun run <script>`.
Menjalankan CLI tanpa install global: `bunx <package-or-command>`.
Jangan mengganti ke `npm`, `pnpm`, atau `yarn` bila Bun dapat melakukan aksi tersebut.
Pertahankan `bun.lock`/`bun.lockb` sesuai versi Bun proyek. Jangan mencampur lockfile package manager. Sebelum menambah dependency, cek apakah fungsi tersebut sudah disediakan SvelteKit, Svelte, shadcn-svelte, atau utilitas existing.
Deprecated, kompatibilitas, dan vulnerability
Sebelum mengintegrasikan modul, cek dokumentasi resmi, peer dependency, release notes, dan kompatibilitas dengan versi SvelteKit/Svelte proyek. Gunakan perintah Bun yang tersedia, misalnya `bun outdated`, `bun pm ls`, `bunx <package> --help`, dan CLI resmi melalui `bunx`. Jangan meneruskan dependency deprecated, abandoned, atau tidak kompatibel tanpa konfirmasi dan alasan tertulis.
Periksa dependency tree dan lockfile sebelum serta sesudah perubahan. Jalankan `bun audit` bila didukung versi Bun proyek; bila tidak tersedia, gunakan scanner yang dapat dijalankan melalui `bunx` dan catat command serta sumber advisories. Jangan menyatakan dependency aman hanya karena install berhasil.
Jika ditemukan RCE, prototype pollution, arbitrary file write, credential leak, supply-chain issue, atau vulnerability lain yang relevan:
Hentikan integrasi atau upgrade yang berisiko.
Beritahu pengguna terlebih dahulu sebelum melanjutkan.
Sertakan nama package, versi terdampak, versi aman bila diketahui, advisory/CVE, deskripsi dampak, severity, dan alasan package tersebut masuk ke dependency graph.
Sertakan contoh reproduksi minimal yang aman dan lokal untuk menunjukkan kondisi vulnerability; jangan menjalankan exploit terhadap sistem nyata.
Jelaskan mitigasi: upgrade, downgrade, patch, removal, lockfile override, isolasi server-side, atau penggantian package.
Jangan menyembunyikan audit result, menurunkan severity, menghapus lockfile, atau mengganti scanner agar hasil terlihat bersih. Jangan menaruh credential, token, exploit aktif, atau payload berbahaya di repository.
3. Baseline teknologi
Gunakan atau pertahankan teknologi berikut bila sesuai dengan proyek:
SvelteKit dan Svelte 5 Runes dengan TypeScript strict.
Bun sebagai runtime dan package manager.
Tailwind CSS serta shadcn-svelte untuk primitive UI.
`zod` untuk validasi runtime.
Prisma dengan konfigurasi yang cocok dengan versi Prisma yang benar-benar terpasang.
MySQL atau PostgreSQL sebagai database relasional.
Vitest untuk unit/integration dan Playwright untuk behavior browser/e2e.
MDsveX untuk dokumentasi yang dirender oleh SvelteKit.
PWA dengan `manifest.json` dan `src/service-worker.ts` bila kebutuhan produk mendukungnya.
Database harus tetap dekat dengan MySQL atau PostgreSQL. Proyek yang belum menentukan database wajib dikonfirmasi kepada pengguna, baik melalui pertanyaan langsung maupun dokumen SRS/PRD yang diberikan. Saat ini MySQL boleh menjadi default hanya jika konteks proyek mengonfirmasinya. Jangan mengubah provider Prisma, migration, atau tipe kolom secara diam-diam.
4. Struktur folder dan local-based component
Utamakan local-based component: kode yang hanya dipakai satu route atau satu feature tetap dekat dengan pemakainya. Jangan memaksa developer melompat ke folder global untuk menemukan komponen spesifik halaman. Pindahkan kode ke `src/lib/` hanya setelah benar-benar shared dan kontraknya stabil.
Struktur feature yang disarankan:
```text
src/routes/(app)/<area>/<feature>/
├── +page.svelte             # composition dan UI state
├── +page.server.ts          # load/action tipis dan route wiring
├── components/              # komponen presentasi khusus feature
├── services/                # use case, workflow, persistence
├── schemas/                 # validasi boundary
├── types/                   # tipe compile-time feature
├── utils/                   # helper pure lokal
└── adapters/                # opsional; external transport dan mapping bila dibutuhkan

src/lib/
├── components/              # komponen lintas feature yang stabil
├── server/                  # server-only module
├── utils/                   # utilitas lintas feature
└── ...

src/docs/                    # sumber dokumentasi MDsveX, sejajar dengan src/lib dan src/routes
```
Buat folder hanya ketika ada file yang membutuhkannya. Pertahankan konvensi folder SvelteKit (`+page.svelte`, `+page.server.ts`, `+server.ts`, `+layout.svelte`, `hooks.server.ts`). Jangan membuat folder helper ber-prefix `\_` hanya karena kebiasaan lain; ikuti pola existing proyek.
Tanggung jawab layer:
Layer	Boleh memiliki	Tidak boleh memiliki
`+page.svelte`	render, state presentasi, navigasi, feedback	Prisma, private env, secret, business rule sensitif
`+page.server.ts`	parsing route, load/action, pemanggilan service	workflow database panjang atau markup
`+server.ts`	HTTP method, auth, parsing body, response	markup atau state UI
`components/`	markup, props typed, callback, accessibility	query database atau secret
`services/`	use case, business rule, transaction, orchestration	markup Svelte atau detail visual
`schemas/`	validasi dan normalisasi input	side effect, query, logging
`types/`	kontrak compile-time	fungsi utilitas atau side effect
`adapters/`	komunikasi API dan mapping external bila dibutuhkan	menjadi kewajiban tanpa dasar kebutuhan atau menyebarkan payload external ke UI
5. Component, icon, dan visual design
shadcn-svelte
Usahakan menggunakan shadcn-svelte pada setiap halaman untuk button, input, form, dialog, sheet, table, dropdown, tabs, card, alert, tooltip, dan primitive UI lain yang tersedia. Gunakan Bits/helper `cn` existing sebelum membuat primitive baru. Custom markup tetap boleh bila komponen library tidak cocok secara semantik, accessibility, atau kebutuhan desain; jelaskan keputusan lokalnya.
Semantic markup dan struktur DOM
Gunakan primitive shadcn-svelte dengan semantic HTML yang tepat. Utamakan `<main>`, `<header>`, `<nav>`, `<section>`, `<article>`, `<aside>`, `<footer>`, `<form>`, `<fieldset>`, `<ul>`, dan `<ol>` sesuai makna konten. Hindari raw HTML yang menggantikan komponen shadcn-svelte ketika komponen tersedia, tetapi jangan memakai `<div>` sebagai pengganti elemen semantik.
Hindari `div soup` dan nested `<div>` yang tidak memiliki tanggung jawab layout atau accessibility yang jelas. Setiap wrapper harus memiliki alasan yang dapat dijelaskan. Pecah komponen hanya bila meningkatkan keterbacaan, reuse yang nyata, atau accessibility; jangan membuat wrapper dan komponen dekoratif tanpa nilai.
Icon
Utamakan `@hugeicons/core-free-icons` dan `@hugeicons/svelte`. Jangan menggambar SVG manual atau mencampur beberapa icon library tanpa alasan desain/kompatibilitas. Icon-only control wajib memiliki accessible label atau title. Icon tidak boleh menjadi satu-satunya pembawa informasi penting.
Gaya halaman
Gunakan border-radius yang konsisten. Tetapkan token atau skala radius di theme lalu pakai secara konsisten; variasi hanya jika prinsip UI/UX membutuhkannya.
Gunakan font Poppins bila proyek tidak memiliki brand font yang telah ditetapkan. Jangan memakai font yang tampak norak, jadul, atau tidak sesuai konteks produk.
Gunakan gradien berdasarkan SRS/PRD, brand, konteks produk, contrast, dan teori skema warna. Jangan memilih Indigo/Blue secara acak. Dokumentasikan alasan warna utama jika keputusan visual tidak jelas.
Pastikan contrast, focus state, keyboard navigation, reduced motion, dan ukuran target interaksi dapat digunakan.
Hindari emoji di UI, kode, pesan error, nama file, dan dokumentasi teknis.
Jangan menumpuk badge di atas judul section. Badge hanya digunakan bila memberi informasi status yang nyata, terutama pada komponen table shadcn-svelte atau halaman profil bila memang diperlukan.
Setiap halaman tetap memiliki loading, empty, error, dan success feedback yang bermakna.
6. Naming, TypeScript, dan formatting
File dan folder lowercase kebab-case, kecuali file khusus SvelteKit.
Komponen `modal-action.svelte` memakai simbol `ModalAction`.
Service `form.service.ts` memakai class `FormService`.
Schema `<entity>.schema.ts` memakai satu nama konstanta yang jelas.
Identifier teknis berbahasa Inggris; label dan pesan mengikuti bahasa aplikasi.
Function/variable camelCase; boolean memakai `is`, `has`, `can`, atau `should`.
Type/interface PascalCase tanpa prefix `I`; tempatkan type/interface di `types/`, bukan di service/schema.
Konstanta config scalar memakai `SCREAMING\_SNAKE\_CASE` bila pola proyek menggunakannya.
Pertahankan `strict: true`; jangan memakai `any`, `@ts-ignore`, atau `@ts-expect-error` tanpa alasan terdokumentasi.
Boundary tidak dipercaya dimulai sebagai `unknown`, divalidasi dengan Zod, lalu dinarrow.
Gunakan `satisfies` untuk config dan `z.infer` untuk tipe yang berasal dari schema.
Gunakan tipe virtual dari `./$types`; jangan mengimpor tipe dari file route fisik.
Public/exported function pada route, service, adapter, util, dan test helper memiliki return type eksplisit.
Jangan menjalankan formatter otomatis setelah modifikasi kode apa pun. Prettier, Biome, formatter editor, dan formatter lain DILARANG digunakan setelah kode dimodifikasi, diubah, diedit, ditulis, atau diperbarui. Format kode secara manual dan pertahankan style lokal tanpa menambahkan workaround formatter.
Urutan import/export di dalam kurung kurawal harus alfabetis A-Z, termasuk `import { afterEach, beforeEach, describe, it, vi } from "vitest";`.
Urutan statement import/export berdasarkan sumbernya: package atau alias yang dimulai `@`, lalu sumber tanpa `@` dan tanpa `$`, lalu alias yang dimulai `$`; setiap grup diurutkan A-Z. Contoh package `@hugeicons/svelte` berada sebelum `svelte`, dan `svelte` berada sebelum `$lib`/`$routes`.
Gunakan path file/package lengkap untuk import dan export. Untuk module internal, utamakan alias lengkap seperti `$routes/(app)/.../form.service.ts` atau `$lib/...`; hindari path relatif seperti `./form.service.ts` ketika alias proyek tersedia. Jangan memendekkan path hingga maksud layer/feature tidak terlihat. Pengecualian hanya untuk virtual module wajib SvelteKit seperti `./$types` atau pola yang dipersyaratkan toolchain.
Pertahankan import type pada grup yang sama dan jangan mengorbankan urutan anggota kurung kurawal.
Terapkan KISS, YAGNI, dan DRY secara seimbang. Jangan membuat helper, wrapper, type alias, atau abstraction sebelum ada kebutuhan nyata. Function yang hanya 1–3 baris atau variabel yang hanya dipakai sekali, termasuk `$derived` yang tidak dipakai ulang, dilebur ke expression pemakainya bila tidak mengurangi keterbacaan, debugging, accessibility, atau type safety. Jangan meng-inline logic yang memiliki side effect, error boundary, nama domain penting, atau potensi reuse.
7. Service, schema, dan utilitas state
Service serta utilitas state berbasis `\*.svelte.ts` wajib bersifat OOP dan menggunakan class yang memiliki tanggung jawab jelas. Gunakan method static hanya untuk operasi stateless tanpa dependency; gunakan instance dan dependency injection untuk client, adapter, clock, repository, atau boundary yang perlu diganti saat test. Jangan membuat class kosong hanya sebagai namespace.
File OOP seperti `\*.service.ts` dan `\*.svelte.ts` DILARANG KERAS memiliki `function`, `const`, `let`, helper, constant, atau executable code di luar class selain import yang diperlukan. Semua helper, constant, dan behavior harus menjadi member atau method class. Jangan membuat deklarasi top-level baru untuk mengakali aturan ini.
Method/function di file service dan `\*.svelte.ts` diurutkan alfabetis A-Z berdasarkan nama method/function. Urutan ini berlaku di dalam class maupun antar deklarasi top-level. Jangan menggabungkan type/interface, schema, atau helper unrelated ke file tersebut.
`form.service.ts` memiliki aturan lebih ketat: setelah import dan deklarasi class yang diperlukan, hanya sediakan operasi `create`, `delete`, dan `update` sesuai kebutuhan form. Jangan menaruh `type`, `interface`, schema, utilitas, query unrelated, atau method tambahan di dalamnya. Jika soft delete dipakai, method `delete` harus mengikuti makna kontrak proyek dan lebih baik diberi nama domain seperti `deactivate` bila tidak benar-benar menghapus data.
File `\*.schema.ts` sedapat mungkin hanya memiliki satu exported constant schema dan tidak mengekspor `type` atau `interface`. Validasi harus ketat dan mencerminkan input form serta invariant database: trim, format, enum, range, coercion FormData yang diperlukan, optional blank normalization, dan `.strict()` untuk object yang tidak boleh menerima field asing. Letakkan tipe hasil inferensi di `types/` atau file pemakai.
Jangan membuat `type` atau `interface` baru bila tipe resmi dari package, SvelteKit, Prisma Client hasil `bunx prisma generate`, atau library terkait sudah tersedia. Untuk model Prisma, gunakan generated model/type seperti `Prisma.<Model>GetPayload`, `Prisma.<Model>CreateInput`, atau `Prisma.<Model>UpdateInput` sesuai boundary; jangan menyalin field model ke type/interface feature yang identik. Buat type/interface baru hanya bila membentuk kontrak API, payload external, atau DTO yang memang berbeda dari model; dokumentasikan kontrak API tersebut dalam JSDoc berbahasa Inggris.
8. Svelte 5 dan SvelteKit
Kode baru menggunakan Svelte 5 Runes.
Props typed melalui `$props()`; gunakan `$bindable()` hanya saat child memang memutasi prop.
Gunakan `$state` untuk state yang dibaca template, `$derived` untuk nilai turunan, dan `$effect` hanya untuk side effect dengan cleanup.
Gunakan `fly` dari `svelte/transition` bila transisi membantu orientasi pengguna atau membuat halaman lebih hidup:
`import { fly } from "svelte/transition";`
Gunakan `fly` secara sewajarnya dengan durasi, arah, dan jarak yang halus. Jangan menambahkan transisi pada setiap elemen atau membuat content sulit diakses; hormati `prefers-reduced-motion` dan jangan mengorbankan feedback loading/error.
Gunakan `onclick` dan event attribute modern, bukan `on:click` pada kode baru.
Gunakan `{#snippet}` dan `{@render}` untuk composition serta key domain unik pada each block.
Route module SvelteKit harus mengikuti kontrak jenis file masing-masing, dan hanya mengekspor API framework yang resmi serta memang diperlukan. Tidak ada export tertentu yang wajib selalu ada. `+page.ts` dapat mengekspor `load`, opsi halaman (`prerender`, `ssr`, `csr`, `trailingSlash`, `config` bila didukung versi SvelteKit), serta `entries` untuk route dinamis bila diperlukan; `+page.server.ts` dapat mengekspor padanan server-only tersebut, `load`, dan `actions`. `actions` hanya valid pada `+page.server.ts`.
`+layout.ts` dan `+layout.server.ts` dapat mengekspor `load` serta opsi layout/halaman yang resmi dan relevan, tetapi tidak `actions`. `+server.ts` mengekspor handler HTTP resmi (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`, atau `fallback`) serta opsi endpoint resmi seperti `prerender`, `trailingSlash`, `config`, dan `entries` bila didukung serta diperlukan; jangan mencampurkan `load` atau `actions` ke dalamnya. Selalu cocokkan daftar export dengan dokumentasi dan generated types versi SvelteKit proyek.
`load` boleh memuat logika route langsung tanpa wajib memanggil service/controller. `actions` boleh memuat deklarasi lokal yang diperlukan di dalam handler dan boleh memanggil service/controller sesuai kebutuhan arsitektur; tidak wajib selalu inline. Hindari helper, state mutable per request, dan business logic reusable/kompleks di level module bila tidak diperlukan; pindahkan logic reusable atau kompleks ke layer yang sesuai.
Jangan mengimpor private env, Prisma, bcrypt, atau `.server.ts` ke client.
Auth/RBAC harus ditegakkan di server, bukan hanya dengan menyembunyikan UI.
Mutation form divalidasi ulang di server; validasi client hanya feedback awal.
Endpoint membaca JSON sebagai `unknown`, memvalidasi, baru menggunakan data hasil parse.
Gunakan status semantik: 400 malformed, 401 unauthenticated, 403 forbidden/CSRF, 404 missing, 409 conflict, 500 unexpected.
Pertahankan redirect/framework error yang harus dilempar ulang. Jangan mengubahnya menjadi 500.
Jangan mengirim stack trace, query, token, credential, atau raw database error ke client. Humanize pesan galat agar aman, singkat, dan actionable; detail teknis masuk logger terstruktur.
Gunakan JWT atau token hanya pada bagian krusial jika fitur atau SRS/PRD membutuhkannya, misalnya session/API credential yang memang token-based. Jangan menambahkan JWT sekadar sebagai standar dekoratif; pilih cookie session, token, expiry, rotation, revocation, audience, issuer, dan storage berdasarkan threat model. Token tidak boleh masuk log, URL, HTML, atau response yang tidak perlu.
Terapkan CSRF protection untuk mutation berbasis cookie/session bila relevan, termasuk SameSite cookie, origin/referer validation, dan CSRF token sesuai arsitektur. Cegah XSS dengan escaping default Svelte, validasi URL/protocol, CSP/security headers, dan sanitasi library resmi sebelum menggunakan `{@html}`. Hindari `{@html}` jika konten tidak benar-benar membutuhkan rich text; jangan membangun HTML dari input pengguna.
Untuk perubahan file `.svelte`, baca skill Svelte terkait dan gunakan editor/autofixer atau MCP yang tersedia. Jangan menyalin aturan framework yang sudah disediakan tool bila hanya menambah duplikasi.
9. Prisma, database, dan keamanan data
Gunakan satu Prisma client singleton di boundary server, misalnya `src/lib/server/prisma.ts` atau pola setara existing project. Jangan membuat `new PrismaClient()` di setiap service. Selaraskan generator, adapter, datasource, migration, dan API Prisma dengan versi Prisma yang terpasang; cek dokumentasi resmi versi tersebut melalui Bun sebelum konfigurasi.
Query memilih field minimum dengan `select`/`include` yang sengaja.
Terapkan `deletedAt: null` bila model memakai soft delete.
Gunakan `$transaction` untuk multi-write atomic dan gunakan `tx` secara konsisten di callback.
Hindari N+1 query serta `Promise.all` untuk write yang memiliki dependency.
Gunakan `Decimal` untuk nilai finansial/kuantitas presisi.
Gunakan UTC/ISO untuk persistence dan identifier.
Audit log append-only dan selalu sanitasi field sensitif.
Jangan menyimpan mutable state per request di module server shared.
Gunakan hashing yang sesuai untuk password dan data sensitif seperti NIK. Jangan menyimpan plaintext, reversible encoding, hash lemah, secret hardcoded, atau credential di fixture/log/dokumentasi. Minimalkan data sensitif, batasi akses, dan jangan menampilkan nilai sensitif di response.
Gunakan rate limiter untuk endpoint transaksional, login, reset credential, upload, atau operasi yang dapat disalahgunakan. Rate limit harus server-side, memiliki key yang tepat, dan mengembalikan pesan humanized tanpa membocorkan detail internal.
JWT, token, CSRF, dan XSS protection tetap bersifat conditional. Pilih hanya mekanisme yang sesuai dengan feature, auth model, browser boundary, dan SRS/PRD; dokumentasikan keputusan serta threat yang ditangani.
10. Zod dan error handling
Setiap form, query penting, JSON body, upload metadata, external response, dan konfigurasi runtime yang tidak dipercaya harus memiliki schema Zod. Pisahkan schema create/update bila required field atau invariant berbeda. Jangan menampilkan `ZodError` mentah; ubah menjadi field error yang dapat dirender UI.
Gunakan logger terpusat dengan context (`entityId`, `operation`, `status`, `error`) dan sanitasi password, JWT/CSRF token, cookie, API token, connection string, request credential, serta payload yang belum disanitasi. Tangkap exception sebagai `unknown`, pertahankan cause/context, dan humanize pesan untuk pengguna. Jangan membuat catch yang hanya mengembalikan `String(error)`.
11. Dokumentasi MDsveX dan JSDoc
Usahakan integrasi MDsveX sesuai versi SvelteKit proyek. Letakkan dokumen di `src/docs`, sejajar dengan `src/lib` dan `src/routes`, lalu buat layout dokumentasi khusus yang memiliki navigasi, sidebar/TOC, breadcrumbs bila relevan, search/filter bila tersedia, code block, link state, responsive layout, dan accessibility. Visualnya mengikuti pola dokumentasi teknis modern seperti Astro Documentation atau Prisma Documentation tanpa menyalin brand mereka.
Dokumentasi source ditulis dalam bahasa Inggris yang sederhana dan mudah dipahami. JSDoc public API juga ditulis dalam bahasa Inggris awam. Bila anotasi dipakai, tulis penjelasan pada baris baru setelah anotasi:
```ts
/\*\*
 \* Creates a customer after validating the submitted form data.
 \*
 \* @param input
 \* The normalized customer fields received from the server boundary.
 \* @returns
 \* The persisted customer summary without sensitive fields.
 \* @throws
 \* When the customer conflicts with an existing unique record.
 \* @example
 \* const customer = await customerService.create(input);
 \*/
```
Gunakan `@description`, `@param`, `@returns`, `@throws`, dan `@example` bila relevan. Jangan menulis JSDoc yang hanya mengulang nama tipe. Dokumentasikan alasan, input, output, failure mode, security boundary, dan contoh yang benar-benar dapat dipahami.
12. PWA dan service worker
Prioritaskan PWA bila kebutuhan aplikasi membutuhkannya. Ikuti konvensi SvelteKit untuk `manifest.json`, icon asset, `src/service-worker.ts`, registration, caching, offline fallback, update lifecycle, dan SSR safety. Jangan mengklaim offline support jika behavior queue/sync belum benar-benar diimplementasikan.
Setiap behavior atau function terkait `self` di `src/service-worker.ts` diurut alfabetis A-Z berdasarkan nama function/handler. Beri JSDoc berbahasa Inggris dengan anotasi yang relevan (`@description`, `@param`, `@returns`, `@throws`, `@example`). Pastikan install, activate, fetch, message, cache invalidation, dan update behavior tidak menelan error secara diam-diam. Uji behavior service worker dengan boundary browser yang sesuai.
13. Static assets dan file yatim
Hindari file aset yatim di `static/`: kelompokkan icon, image, font, dan aset feature dalam folder yang bermakna. File root hanya boleh dikecualikan bila merupakan konfigurasi konvensi seperti `robots.txt`, `manifest.json`, atau file penting setara.
Terapkan prinsip sama pada `src/`: file harus berada di folder layer/feature yang jelas dan tidak tercecer di root tanpa alasan. Jangan memindahkan file existing secara massal hanya untuk memenuhi aturan ini; saat feature disentuh, rapikan path lokal yang aman dan migrasikan semua import/caller.
14. CDN dan beban biaya
Jangan menambahkan tautan atau dependency CDN secara otomatis. Jika CDN dipertimbangkan, hitung terlebih dahulu dampak finansial dan operasional berdasarkan data proyek: ukuran asset dan traffic bulanan, origin egress, jumlah request, cache-hit ratio yang realistis, biaya CDN, biaya request/origin fetch, region, invalidation, serta biaya security/compliance tambahan. Estimasi minimal:
```text
penghematan origin = (traffic yang di-cache × biaya egress origin)
                    + (request origin yang berkurang × biaya request origin)
biaya CDN bersih   = biaya CDN + egress ke CDN + request/invalidation + biaya operasional
manfaat bersih     = penghematan origin - biaya CDN bersih
```
Berikan konfirmasi kepada pengguna sebelum menambahkan CDN atau URL CDN, sertakan asumsi dan rentang estimasi. Jika manfaat bersih tidak material, tidak terbukti, atau bertambah buruk, gunakan asset/package lokal dan hindari CDN. Pertimbangkan juga supply-chain risk, CSP, SRI, availability, privacy, dan cache invalidation; penghematan biaya bukan satu-satunya kriteria.
15. Testing dengan Vitest dan Playwright
Gunakan Vitest untuk schema, utility, pure domain logic, service dengan boundary mock, worker, dan API handler. Gunakan Playwright untuk behavior user nyata, accessibility, navigation, auth flow, dan PWA surface.
Struktur default:
```text
tests/
├── unit/<domain-or-layer>/\*.test.ts
├── integration/\*.test.ts
└── e2e/\*.e2e.test.ts
```
Konfigurasi Vitest mengikuti pola PPC yang sudah dirujuk: plugin SvelteKit, alias `$lib`/`$routes`, environment yang sesuai boundary, coverage exclude untuk generated declaration, test, docs, dan schema bila memang kebijakan coverage proyek demikian, serta include untuk `tests/unit` dan `tests/integration`. Konfigurasi Playwright menempatkan test di `tests/e2e`, memakai suffix `.e2e`, dan menjalankan server melalui Bun. Jangan menyalin konfigurasi mentah; cocokkan versi dan script proyek yang sedang dikerjakan.
Aturan test:
`describe` menyebut feature/unit; `it` menyebut behavior yang terlihat.
Gunakan Arrange, Act, Assert dan fixture deterministik.
Mock hanya boundary: database, network, browser API, dan clock.
Uji success, invalid input, not found, conflict, authorization, error nyata, dan transition penting.
Uji atomicity, rate limit, hashing boundary, retry/dedupe, service worker lifecycle, serta jumlah item nyata bila itu menjadi kontrak.
Restore fetch, timer, navigator, storage, dan mock setelah test.
Assertion harus gagal pada implementasi yang salah; hindari `toBeDefined`, `not.toThrow`, `toBeTruthy` generik, dan assertion yang menerima semua hasil.
Jangan menguji source text, wiring, copy field satu-per-satu, atau default incidental.
16. SOP perubahan kode
Pahami SRS/PRD, actor, role, route, input, output, error, persistence, dan behavior yang berubah.
Analisis ritme proyek: package manager, versi framework, sibling feature, schema, service, route, component, test, config, dan naming.
Cari semua caller/export/reference sebelum mengubah kontrak.
Tetapkan server/client boundary, DTO, schema, auth, rate limit, transaction, external integration bila dibutuhkan, dan UX state.
Implementasikan dari boundary data dan schema, lalu type, adapter bila dibutuhkan, service, route, component/page, documentation, dan test.
Gunakan Bun untuk install, generator, script, compatibility check, dan audit.
Humanize error, lindungi data sensitif, dan jangan mengirim detail internal ke pengguna.
Jalankan pemeriksaan kualitas dan verifikasi yang relevan. Formatter otomatis tetap DILARANG:
`bun run check` untuk validasi SvelteKit, TypeScript, dan accessibility yang dikonfigurasi repository.
`bun run typecheck` bila script tersedia, atau command typecheck resmi repository yang setara.
`bun run build` untuk memastikan aplikasi dapat dikompilasi dan dibundel.
`bunx eslint <changed-files>`
`bunx vitest run <targeted-test>` atau `bunx playwright test <targeted-e2e>`
audit dependency melalui Bun atau scanner Bun-compatible bila dependency berubah.
Jalankan `typecheck`, `build`, dan `bun run check` bila relevan untuk perubahan; ketiganya BOLEH dan DIREKOMENDASIKAN untuk memastikan tidak ada kode yang mengalami galat. Jangan menjalankan `prettier`, `biome`, atau formatter otomatis lainnya.
Untuk UI/PWA, lakukan smoke test pada surface aktual; pastikan accessibility, responsive layout, loading/error/empty state, cache/update behavior, dan no-leak server boundary.
Review sebagai consumer dan selesaikan cutover: migrasikan caller, hapus path obsolete, serta jangan meninggalkan placeholder, deprecated alias, no-op, credential, atau workaround formatter.
Jika pekerjaan mulai keluar dari konteks skill ini, bertentangan dengan konvensi SvelteKit, tidak sesuai dengan SRS/PRD, atau memerlukan keputusan yang tidak dapat dibuktikan dari repository, berikan konfirmasi kepada pengguna sebelum memilih arah implementasi.
17. Definition of done
Perubahan siap dianggap selesai hanya jika:
Folder, file, dan komponen berada pada local feature layer yang tepat.
Metadata skill dan dependency action memakai nama serta command global yang benar.
Tidak ada import server/private ke client.
Input, config, dan external response tervalidasi ketat dengan Zod.
Service dan `\*.svelte.ts` bersifat OOP, method/function A-Z, dan layer tidak tercampur.
File OOP tidak memiliki `function`, `const`, `let`, helper, constant, atau executable code di luar class; hanya import yang diperlukan boleh berada di luar class.
Route module hanya mengekspor API framework SvelteKit yang resmi, valid untuk jenis file tersebut, dan memang dibutuhkan; tidak ada whitelist dua export dan tidak ada `load`/`actions` yang wajib selalu hadir. Bedakan kontrak `+page.server.ts`, `+page.ts`, `+layout.server.ts`, `+layout.ts`, dan `+server.ts` sesuai dokumentasi serta generated types versi SvelteKit. Deklarasi lokal yang diperlukan di dalam handler diperbolehkan; tetap hindari helper, state mutable per request, dan business logic reusable/kompleks di level module bila tidak diperlukan.
Import/export diurutkan A-Z di dalam kurung kurawal, grup sumber mengikuti `@` lalu non-`@`/non-`$` lalu `$`, dan path internal lengkap memakai alias bila tersedia.
Adapter hanya dibuat bila dibutuhkan sistem atau SRS/PRD.
Markup memakai semantic tags, menghindari `div soup`, dan transisi `fly` digunakan secara halus bila relevan.
KISS, YAGNI, dan DRY diterapkan tanpa mengorbankan readability, accessibility, type safety, atau observability.
Tidak ada type/interface duplikat dari generated Prisma atau package resmi; kontrak API baru terdokumentasi.
JWT/token, CSRF, dan XSS protection diterapkan secara conditional berdasarkan threat model dan kebutuhan fitur.
CDN tidak ditambahkan tanpa estimasi biaya/manfaat dan konfirmasi pengguna.
`form.service.ts` hanya memiliki create/delete/update; schema hanya mengekspor satu konstanta tanpa type/interface.
Prisma memakai singleton, versi konfigurasi cocok, query aman, dan transaction boundary benar.
Password/data sensitif di-hash, endpoint transaksional memiliki rate limit, dan error di-humanize.
UI menggunakan shadcn-svelte serta Hugeicons bila sesuai, radius/font/warna konsisten, tanpa emoji dan badge berlebihan.
Dokumentasi berada di `src/docs`, memakai MDsveX/layout, dan JSDoc public API berbahasa Inggris yang berguna.
PWA manifest/service worker mengikuti konvensi, behavior `self` terurut A-Z, dan didokumentasikan bila dipakai.
Tidak ada aset atau file source yatim tanpa alasan konvensi.
Vitest/Playwright membuktikan behavior penting, bukan sekadar wiring.
Check, lint, dan smoke/targeted test relevan telah dijalankan tanpa formatter otomatis.
Tidak ada placeholder, no-op, raw secret, credential, exploit aktif, deprecated dependency yang tidak dikonfirmasi, atau workaround formatter yang tidak beralasan.
