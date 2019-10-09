export class SkinnedMeshCollider {
    /**
     *
     * @param {SkinnedMesh} skinnedMesh
     */
    from(skinnedMesh) {
        /*
        See "Math for Game Programmers: Interaction With 3D Geometry" GDC talk by Stan Melax: https://www.youtube.com/watch?v=GpsKrAipXm8
         */
        // 1) get bones
        // 2) get vertex sets for each bone
        // 3) build convex volumes for each vertex set
        // 4) Join volumes with constraints
    }
}
