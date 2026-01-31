import { agnes } from 'ml-hclust';
import { Matrix } from 'ml-matrix';

// Mock Data: 4 samples. 2 close to (0,0), 2 close to (10,10)
const vectors = [
    [0.1, 0.1],
    [0.2, 0.2],
    [10.1, 10.1],
    [10.2, 10.2]
];

// Calculate Distance Matrix
const n = vectors.length;
const distMatrix = Array(n).fill(0).map(() => Array(n).fill(0));

for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
        const dx = vectors[i][0] - vectors[j][0];
        const dy = vectors[i][1] - vectors[j][1];
        distMatrix[i][j] = Math.sqrt(dx * dx + dy * dy);
    }
}

console.log('Distance Matrix:', distMatrix);

// Run Clustering
try {
    const tree = agnes(distMatrix, { method: 'ward' });
    console.log('Tree constructed.');

    const k = 2;
    const groups = tree.group(k);
    console.log('Groups created:', groups);

    // Check structure
    if (groups.children) {
        console.log(`Found ${groups.children.length} subgroups.`);
        groups.children.forEach((child, idx) => {
            console.log(`Group ${idx + 1} size:`, getLeafCount(child));
        });
    } else {
        console.log('No children found in group result. Structure might be different.');
    }

} catch (e) {
    console.error('Clustering failed:', e);
}

function getLeafCount(node) {
    if (node.isLeaf) return 1;
    let count = 0;
    if (node.children) {
        node.children.forEach(c => count += getLeafCount(c));
    }
    return count;
}
