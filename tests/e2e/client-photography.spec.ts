import {test,expect} from "@playwright/test";

test("approved client photography loads in its matching homepage and service placement", async ({page},info)=>{
  test.setTimeout(180_000);
  const placements=[
    ["/",".hero-image img","home-care-companion.png"],
    ["/",".about-image img","home-sample-collection.png"],
    ["/about",".about-image img","home-sample-collection.png"],
    ["/services/nursing-care",".service-hero-image img","nursing-at-home.png"],
    ["/services/caretaker-services",".service-hero-image img","home-care-companion.png"],
    ["/services/physiotherapy",".service-hero-image img","physiotherapy-treatment.jpg"],
    ["/services/medical-equipment",".service-hero-image img","medical-equipment-home.png"],
    ["/services/online-consultation",".service-hero-image img","online-consultation.jpg"],
    ["/services/laboratory-services",".service-hero-image img","home-sample-collection.png"],
  ];
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  for(const [route,selector,file] of placements){
    await page.goto(route);
    for(const width of [320,375,390,430,768,1024,1280,1440]){
      await page.setViewportSize({width,height:900});
      const image=page.locator(selector);await expect(image).toHaveAttribute("src",new RegExp(file.replace(".","\\.")));
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((img:HTMLImageElement)=>img.decode());
      expect(await image.getAttribute("alt")).toBeTruthy();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} at ${width}`).toBe(true);
      if(width===390||width===1440){
        await page.evaluate(()=>document.fonts.ready);
        const frame = page.locator(selector.replace(" img", ""));
        await frame.scrollIntoViewIfNeeded();
        await frame.screenshot({ path: info.outputPath(`${route === "/" ? "home" : route.split("/").pop()}-${selector.split(" ")[0].slice(1)}-${width}.png`) });
      }
    }
    // Settle link prefetches before forcing the next full document navigation;
    // Windows WebKit reports cancelled RSC prefetches as page errors.
    await page.waitForLoadState("networkidle");
  }
  expect(errors).toEqual([]);
});
