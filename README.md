# Trump-Boyer Magic Cube Visualization

An interactive 3D visualization of the perfect magic cube of order 5 discovered
by Walter Trump and Christian Boyer in 2003.

## About Magic Cubes

Magic cubes are three-dimensional arrangements of numbers where all rows,
columns, pillars, and space diagonals sum to the same value. The Trump-Boyer
Cube (2003) is a remarkable perfect magic cube of order 5.

## Development

To set up the development environment:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open http://localhost:8000/ in your browser.

To build the distribution files:

```bash
npm run build
```
## Configuration

The visualization can be customized through configuration options passed to the
`create()` method or later via the `updateConfig()` method.

```javascript
// Basic usage with custom configuration
const cube = TrumpBoyerCube.create(document.getElementById('container'), {
  autoRotate: true,
  showNodeNumbers: false,
  colors: {
    background: 0x222222
  }
});

// Update configuration after creation
cube.updateConfig({
  lineMode: 'even',
  nodeSize: 0.2
});
```

See the [full examples](./examples/index.html) for all available configuration
options.

## License

MIT © José Fernández Ramos
