import { agnes } from 'ml-hclust';

// Mock Data: 4 samples. 
// A and B close (dist 0.14)
// C and D close (dist 0.14)
// (A,B) far from (C,D) (dist ~14)

const n = 4;
const distMatrix = [
    [0, 0.14, 14.1, 14.2],
    [0.14, 0, 14.0, 14.1],
    [14.1, 14.0, 0, 0.14],
    [14.2, 14.1, 0.14, 0]
];

console.log('Running Clustering with ml-hclust...');

try {
    const tree = agnes(distMatrix, { method: 'ward' });
    console.log('Tree constructed.');

    const k = 2;
    // Check if group() exists on tree
    if (typeof tree.group === 'function') {
        const result = tree.group(k);
        console.log('Group Result:', JSON.stringify(result, null, 2));
    } else {
        console.error('tree.group is not a function. Check library version.');
        console.log('Tree keys:', Object.keys(tree));
    }

} catch (e) {
    console.error('Clustering failed:', e);
}
