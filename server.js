import express from "express";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import { readdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Cache
const cache = new Map();

// ==================== AUTO-LOAD ROUTES ====================
let allEndpoints = [];

async function loadRoutes() {
  const routesPath = path.join(__dirname, "routes");
  const routeFiles = readdirSync(routesPath).filter(file => file.endsWith(".js"));
  
  console.log(chalk.cyan("\n🔄 Loading routes...\n"));
  
  for (const file of routeFiles) {
    try {
      const routePath = path.join(routesPath, file);
      const route = await import(`file://${routePath}?t=${Date.now()}`);
      
      console.log(chalk.yellow(`  🔍 Debug ${file}:`));
      console.log(chalk.gray(`     - Has default export: ${!!route.default}`));
      console.log(chalk.gray(`     - Default type: ${typeof route.default}`));
      
      // Register router
      if (route.default && typeof route.default === 'function') {
        app.use(route.default);
        console.log(chalk.green(`  ✓ Router registered: ${file}`));
        
        // Log routes
        if (route.default.stack) {
          route.default.stack.forEach(layer => {
            if (layer.route) {
              const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
              console.log(chalk.blue(`    → ${methods} ${layer.route.path}`));
            }
          });
        }
      }
      
      // Collect metadata
      if (route.metadata) {
        if (Array.isArray(route.metadata)) {
          allEndpoints.push(...route.metadata);
        } else {
          allEndpoints.push(route.metadata);
        }
        console.log(chalk.green(`  ✓ Metadata collected`));
      }
      
    } catch (error) {
      console.error(chalk.red(`  ✗ Failed: ${file}`), error.message);
    }
  }
  
  console.log(chalk.cyan(`\n✅ Total ${allEndpoints.length} endpoints loaded\n`));
}

// ==================== START SERVER ====================
async function startServer() {
  try {
    // STEP 1: Register core routes FIRST
    console.log(chalk.cyan("⚙️  Registering core routes...\n"));
    
    app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        total_endpoints: allEndpoints.length
      });
    });

    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    });

    app.get("/api", (req, res) => {
      res.json({
        name: "NekoLabs API Server",
        version: "2.0.0",
        total_endpoints: allEndpoints.length,
        endpoints: allEndpoints.map(e => ({
          name: e.name,
          path: e.path,
          method: e.method
        }))
      });
    });

    app.get("/api/docs", (req, res) => {
      res.json({
        success: true,
        total: allEndpoints.length,
        endpoints: allEndpoints
      });
    });

    app.get("/debug/routes", (req, res) => {
      const routes = [];
      
      app._router.stack.forEach(middleware => {
        if (middleware.route) {
          routes.push({
            path: middleware.route.path,
            methods: Object.keys(middleware.route.methods)
          });
        } else if (middleware.name === 'router') {
          middleware.handle.stack.forEach(handler => {
            if (handler.route) {
              routes.push({
                path: handler.route.path,
                methods: Object.keys(handler.route.methods)
              });
            }
          });
        }
      });
      
      res.json({
        total: routes.length,
        routes: routes
      });
    });
    
    console.log(chalk.green("✓ Core routes registered\n"));
    
    // STEP 2: Load dynamic routes
    await loadRoutes();
    
    // STEP 3: Register 404 handler (MUST BE LAST!)
    console.log(chalk.cyan("⚙️  Registering error handlers...\n"));
    
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: "Endpoint not found",
        path: req.path,
        method: req.method,
        hint: "Visit /debug/routes to see all routes"
      });
    });

    app.use((err, req, res, next) => {
      console.error(chalk.red("Error:"), err.message);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: err.message
      });
    });
    
    console.log(chalk.green("✓ Error handlers registered\n"));
    
    // STEP 4: Start listening
    const PORT = process.env.PORT || 3000;
    
    app.listen(PORT, () => {
      console.log(chalk.bgGreen.black(`\n ✓ Server running on port ${PORT} `));
      console.log(chalk.bgBlue.white(` ℹ Total endpoints: ${allEndpoints.length} `));
      console.log(chalk.cyan(`\n📚 Home: http://localhost:${PORT}`));
      console.log(chalk.cyan(`📚 API Docs: http://localhost:${PORT}/api/docs`));
      console.log(chalk.cyan(`📚 Debug: http://localhost:${PORT}/debug/routes`));
      console.log(chalk.yellow(`\n🔥 Test endpoint: http://localhost:${PORT}/api/test\n`));
    });
    
  } catch (err) {
    console.error(chalk.bgRed.white(` Failed: ${err.message} `));
    process.exit(1);
  }
}

startServer();

export default app;