"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi, type ApiMarketplaceProduct } from "@/lib/platform-api";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";

export default function StudioPage() {
  const { t } = useLocale();
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [tab, setTab] = React.useState<"dashboard" | "product" | "project" | "server">("dashboard");
  const [msg, setMsg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [products, setProducts] = React.useState<ApiMarketplaceProduct[]>([]);

  const [projectName, setProjectName] = React.useState("");
  const [projectDesc, setProjectDesc] = React.useState("");
  const [gameSlugs, setGameSlugs] = React.useState("dayz");

  const [serverName, setServerName] = React.useState("");
  const [serverGame, setServerGame] = React.useState("dayz");
  const [host, setHost] = React.useState("127.0.0.1");
  const [port, setPort] = React.useState("27015");

  const [productTitle, setProductTitle] = React.useState("");
  const [productDesc, setProductDesc] = React.useState("");
  const [productType, setProductType] = React.useState("mod");
  const [productGame, setProductGame] = React.useState("dayz");
  const [productPrice, setProductPrice] = React.useState("349");
  const [productTags, setProductTags] = React.useState("hardcore,ui");

  const loadCreatorProducts = React.useCallback(() => {
    fetchApi<{ items: ApiMarketplaceProduct[]; total: number }>("/marketplace/creator/products")
      .then((r) => setProducts(r.items))
      .catch(() => setProducts([]));
  }, []);

  React.useEffect(() => {
    if (user) loadCreatorProducts();
  }, [user, loadCreatorProducts]);

  const submitProject = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetchApi<{ slug: string }>("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: projectName,
          description: projectDesc,
          game_slugs: gameSlugs.split(",").map((s) => s.trim()),
          links: {},
        }),
      });
      setMsg(`${t.studio.created}: ${r.slug}`);
      router.push(`/projects/${r.slug}`);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : t.studio.signInFirst);
    } finally {
      setLoading(false);
    }
  };

  const submitServer = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetchApi<{ id: string }>("/servers", {
        method: "POST",
        body: JSON.stringify({
          game: serverGame,
          name: serverName,
          host,
          port: parseInt(port, 10),
          tags: {},
        }),
      });
      setMsg(t.studio.created);
      router.push(`/servers/${r.id}`);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : t.studio.signInFirst);
    } finally {
      setLoading(false);
    }
  };

  const submitProduct = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetchApi<ApiMarketplaceProduct>("/marketplace/products", {
        method: "POST",
        body: JSON.stringify({
          title: productTitle,
          short_description: productDesc,
          description: productDesc,
          product_type: productType,
          game_slug: productGame,
          price_rub: Number(productPrice || 0),
          is_free: Number(productPrice || 0) === 0,
          tags: productTags.split(",").map((s) => s.trim()).filter(Boolean),
          version: "1.0.0",
        }),
      });
      setMsg(`Продукт отправлен на модерацию: ${r.title}`);
      setProductTitle("");
      setProductDesc("");
      await refresh();
      loadCreatorProducts();
      setTab("dashboard");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : t.studio.signInFirst);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = products.reduce((sum, product) => sum + product.sales_count, 0);
  const pending = products.filter((product) => product.moderation_status === "pending").length;
  const approved = products.filter((product) => product.moderation_status === "approved").length;

  return (
    <div className="space-y-10 pb-14">
      <section className="holo-panel rounded-[2.7rem] p-8">
        <Badge tone="info">{t.studio.badge}</Badge>
        <h1 className="mt-4 text-5xl font-semibold">
          {t.studio.title} <span className="text-gradient">{t.studio.titleAccent}</span>
        </h1>
        <p className="mt-4 text-fg-muted">{t.studio.subtitle}</p>
      </section>

      {!user ? (
        <section className="holo-panel rounded-[2rem] p-6">
          <h2 className="text-2xl font-semibold">{t.studio.signInFirst}</h2>
          <Link href="/auth/login" className="mt-5 inline-block">
            <Button>{t.nav.signIn}</Button>
          </Link>
        </section>
      ) : null}

      {user ? (
        <div className="flex flex-wrap gap-2">
          {(["dashboard", "product", "project", "server"] as const).map((tb) => (
            <Chip key={tb} active={tab === tb} onClick={() => setTab(tb)}>
              {tb === "dashboard"
                ? t.studio.tabDashboard
                : tb === "product"
                  ? t.studio.tabProduct
                  : tb === "project"
                    ? t.studio.tabProject
                    : t.studio.tabServer}
            </Chip>
          ))}
          <Link href="/billing" className="ml-auto text-sm text-primary hover:underline">
            {t.studio.billingLink}
          </Link>
        </div>
      ) : null}

      {msg ? <p className="text-sm text-primary">{msg}</p> : null}

      {user && tab === "dashboard" ? (
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="organism-panel rounded-2xl p-5">
              <div className="text-sm text-fg-muted">Продуктов</div>
              <div className="mt-2 text-3xl font-semibold">{products.length}</div>
            </div>
            <div className="organism-panel rounded-2xl p-5">
              <div className="text-sm text-fg-muted">Approved / Pending</div>
              <div className="mt-2 text-3xl font-semibold">{approved}/{pending}</div>
            </div>
            <div className="organism-panel rounded-2xl p-5">
              <div className="text-sm text-fg-muted">Продаж</div>
              <div className="mt-2 text-3xl font-semibold text-gradient">{totalSales}</div>
            </div>
          </div>
          <div className="holo-panel rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">Мои продукты</h2>
              <Button size="sm" variant="premium" onClick={() => setTab("product")}>Новый продукт</Button>
            </div>
            <div className="mt-5 space-y-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link href={`/marketplace/${product.slug}`} className="font-medium hover:text-primary">
                        {product.title}
                      </Link>
                      <div className="mt-1 text-xs text-fg-muted">
                        {product.product_type} · {product.game_slug ?? "any"} · {product.sales_count} sales
                      </div>
                    </div>
                    <Badge tone={product.moderation_status === "approved" ? "success" : product.moderation_status === "rejected" ? "danger" : "warning"}>
                      {product.moderation_status ?? "pending"}
                    </Badge>
                  </div>
                </div>
              ))}
              {products.length === 0 ? <p className="text-sm text-fg-muted">Пока нет продуктов. Создайте первый мод или аддон.</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {user && tab === "product" ? (
        <div className="holo-panel max-w-2xl space-y-4 rounded-[2rem] p-6">
          <Badge tone="info">{t.studio.wizardProductTitle}</Badge>
          <p className="text-sm text-fg-muted">{t.studio.wizardProductDesc}</p>
          <Input value={productTitle} onChange={(e) => setProductTitle(e.target.value)} placeholder={t.studio.productTitle} />
          <Input value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder={t.studio.description} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input value={productType} onChange={(e) => setProductType(e.target.value)} placeholder={t.studio.productType} />
            <Input value={productGame} onChange={(e) => setProductGame(e.target.value)} placeholder={t.studio.gameSlug} />
            <Input value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="₽" />
          </div>
          <Input value={productTags} onChange={(e) => setProductTags(e.target.value)} placeholder="tags" />
          <div className="rounded-2xl border border-dashed border-white/15 p-4 text-xs text-fg-muted">
            <p>{t.studio.uploadCover}</p>
            <p className="mt-1">{t.studio.uploadFile}</p>
            <p className="mt-2">{t.studio.uploadHint}</p>
          </div>
          <Button disabled={loading || !productTitle} onClick={submitProduct}>
            {t.studio.submitProduct}
          </Button>
        </div>
      ) : null}

      {user && tab === "project" ? (
        <div className="holo-panel max-w-xl space-y-4 rounded-[2rem] p-6">
          <p className="text-sm text-fg-muted">{t.studio.wizardProjectDesc}</p>
          <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder={t.studio.projectName} />
          <Input value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} placeholder={t.studio.description} />
          <Input value={gameSlugs} onChange={(e) => setGameSlugs(e.target.value)} placeholder={t.studio.gamesList} />
          <Button disabled={loading || !projectName} onClick={submitProject}>
            {t.studio.createProject}
          </Button>
        </div>
      ) : null}

      {user && tab === "server" ? (
        <div className="holo-panel max-w-xl space-y-4 rounded-[2rem] p-6">
          <p className="text-sm text-fg-muted">{t.studio.wizardServerDesc}</p>
          <Input value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder={t.studio.serverName} />
          <Input value={serverGame} onChange={(e) => setServerGame(e.target.value)} placeholder={t.studio.gameSlug} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder={t.studio.host} />
            <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder={t.studio.port} />
          </div>
          <Button disabled={loading || !serverName} onClick={submitServer}>
            {t.studio.addServer}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
