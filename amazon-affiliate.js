const crypto = require("crypto");

function buildAmazonSpecialLink(productUrl, associateTag) {
  if (!productUrl) {
    throw new Error("Amazon product URL is required.");
  }

  if (!associateTag) {
    throw new Error("AMAZON_ASSOCIATE_TAG is not configured.");
  }

  let url;

  try {
    url = new URL(productUrl);
  } catch (e) {
    throw new Error("Invalid Amazon product URL.");
  }

  const host = url.hostname.toLowerCase();

  if (
    host !== "amazon.com" &&
    !host.endsWith(".amazon.com")
  ) {
    throw new Error(
      "Amazon affiliate links must point to Amazon.com."
    );
  }

  const isProductPage =
    /\/dp\/[A-Z0-9]{10}/i.test(url.pathname) ||
    /\/gp\/product\/[A-Z0-9]{10}/i.test(url.pathname);

  if (!isProductPage) {
    throw new Error(
      "Affiliate links must point to a specific Amazon product page."
    );
  }

  url.searchParams.set("tag", associateTag);

  return url.toString();
}


async function initAmazonAffiliate(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS amazon_click_events(
      id TEXT PRIMARY KEY,
      product_url TEXT NOT NULL,
      content_id TEXT,
      source TEXT,
      clicked_at TIMESTAMPTZ NOT NULL
    )
  `);
}


async function recordAmazonClick(
  pool,
  {
    productUrl,
    contentId = null,
    source = "unknown"
  } = {}
) {
  if (!productUrl) {
    throw new Error("Product URL is required.");
  }

  const id =
    `amazon-click-${Date.now()}-` +
    crypto.randomBytes(4).toString("hex");

  const clickedAt =
    new Date().toISOString();

  await pool.query(
    `
    INSERT INTO amazon_click_events(
      id,
      product_url,
      content_id,
      source,
      clicked_at
    )
    VALUES($1,$2,$3,$4,$5)
    `,
    [
      id,
      productUrl,
      contentId,
      source,
      clickedAt
    ]
  );
     if(contentId){

    await pool.query(
      `
       UPDATE revenue_pipeline
       SET
        clicks=clicks+1,
        status='CLICKED',
        updated_at=$2
       WHERE promotion_id=$1
      `,
      [
       contentId,
       clickedAt
      ]
    );

     }
  return {
    id,
    productUrl,
    contentId,
    source,
    clickedAt
  };
}


async function getAmazonClickStats(pool) {
  const total = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM amazon_click_events
  `);

  const recent = await pool.query(`
    SELECT
      product_url AS "productUrl",
      content_id AS "contentId",
      source,
      clicked_at AS "clickedAt"
    FROM amazon_click_events
    ORDER BY clicked_at DESC
    LIMIT 100
  `);

  return {
    totalClicks:
      total.rows[0]?.count || 0,
    recentClicks:
      recent.rows
  };
}


module.exports = {
  buildAmazonSpecialLink,
  initAmazonAffiliate,
  recordAmazonClick,
  getAmazonClickStats
};
