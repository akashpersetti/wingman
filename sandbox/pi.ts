const PI = Math.PI;

function calculateCircumference(radius: number): number {
    return 2 * PI * radius;
}

function calculateArea(radius: number): number {
    return PI * radius * radius;
}

// Example usage:
const radius = 5;
console.log(`Circumference of the circle: ${calculateCircumference(radius)}`);
console.log(`Area of the circle: ${calculateArea(radius)}`);